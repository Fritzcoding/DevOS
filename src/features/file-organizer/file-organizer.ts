/**
 * File Organizer Feature
 * Deep recursive scan, identifies redundancy and misplaced files
 * Preview-before-apply pattern with .shimeji-trash safety
 */

import { readdirSync, statSync, renameSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import { join, relative, dirname } from 'path';
import { eventBus } from '../../core/event-bus';
import { stateMachine } from '../../core/state-machine';
import { aiClient } from '../../services/ai/ai-client';

export interface FileInfo {
  path: string;
  size_bytes: number;
  last_modified: string;
  extension: string;
  hash?: string; // For dedup
}

export interface RedundantFile {
  path: string;
  reason: string;
  action: 'DELETE' | 'ARCHIVE';
}

export interface FileMove {
  from: string;
  to: string;
  reason: string;
}

export interface OrganizationPlan {
  redundant_files: RedundantFile[];
  moves: FileMove[];
  new_dirs_to_create: string[];
  summary: string;
  risk_level: 'low' | 'medium' | 'high';
}

class FileOrganizerFeature {
  private isProcessing = false;
  private currentScan: FileInfo[] = [];
  private readonly TRASH_DIR = '.shimeji-trash';

  /**
   * Deep scan project for all files (no depth limit)
   */
  deepScan(rootDir: string): {
    files: FileInfo[];
    potential_duplicates_by_size: string[][];
  } {
    console.log(`📂 File Organizer: Deep scanning ${rootDir}...`);

    const files: FileInfo[] = [];
    const sizeGroups: Map<number, string[]> = new Map();

    const walkDir = (dir: string) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          // Skip trash and hidden
          if (item.startsWith('.') || item === 'node_modules' || item === '__pycache__') {
            continue;
          }

          const fullPath = join(dir, item);
          try {
            const stat = statSync(fullPath);

            if (stat.isFile()) {
              const relPath = relative(rootDir, fullPath);
              const size = stat.size;

              // Track for duplicate detection
              if (size > 100) {
                // Only for files > 100 bytes
                if (!sizeGroups.has(size)) {
                  sizeGroups.set(size, []);
                }
                sizeGroups.get(size)!.push(relPath);
              }

              files.push({
                path: relPath,
                size_bytes: size,
                last_modified: stat.mtime.toISOString(),
                extension: this.getExtension(item),
              });
            } else if (stat.isDirectory()) {
              walkDir(fullPath);
            }
          } catch (error) {
            console.debug(`Skipped ${fullPath}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Error scanning ${dir}:`, error);
      }
    };

    walkDir(rootDir);

    // Find potential duplicates (same size, likely same content)
    const potentialDupes: string[][] = [];
    sizeGroups.forEach((paths) => {
      if (paths.length > 1) {
        potentialDupes.push(paths);
      }
    });

    this.currentScan = files;

    return {
      files,
      potential_duplicates_by_size: potentialDupes,
    };
  }

  /**
   * Analyze redundancy using AI
   */
  async analyzeOrganization(scan: { files: FileInfo[]; potential_duplicates_by_size: string[][] }): Promise<OrganizationPlan | null> {
    if (this.isProcessing) {
      console.warn('File organizer already processing');
      return null;
    }

    if (!aiClient.hasApiKey()) {
      eventBus.emit({
        type: 'FEATURE_FAILED',
        feature: 'organizer',
        error: 'Gemini API key not configured',
      });
      return null;
    }

    try {
      this.isProcessing = true;
      await stateMachine.setState('organizer-running');

      const response = await aiClient.analyzeFileOrganization(scan);

      if (!response.success) {
        eventBus.emit({
          type: 'FEATURE_FAILED',
          feature: 'organizer',
          error: response.error || 'Unknown error',
        });
        return null;
      }

      const plan = response.data as OrganizationPlan;

      eventBus.emit({
        type: 'FEATURE_COMPLETE',
        feature: 'organizer',
        result: plan,
      });

      await stateMachine.setState('idle');

      return plan;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      eventBus.emit({
        type: 'FEATURE_FAILED',
        feature: 'organizer',
        error: message,
      });
      await stateMachine.setState('idle');
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Preview the plan (show what WILL happen)
   */
  previewPlan(plan: OrganizationPlan): string[] {
    const lines: string[] = [];

    lines.push(`📋 Organization Plan Preview (Risk: ${plan.risk_level.toUpperCase()})\n`);

    if (plan.redundant_files.length > 0) {
      lines.push(`🗑️ Redundant Files (${plan.redundant_files.length}):`);
      for (const file of plan.redundant_files) {
        lines.push(`  DELETE: ${file.path}`);
        lines.push(`    Reason: ${file.reason}`);
      }
      lines.push('');
    }

    if (plan.moves.length > 0) {
      lines.push(`🔄 Files to Move (${plan.moves.length}):`);
      for (const move of plan.moves) {
        lines.push(`  ${move.from} → ${move.to}`);
        lines.push(`    Reason: ${move.reason}`);
      }
      lines.push('');
    }

    if (plan.new_dirs_to_create.length > 0) {
      lines.push(`📁 New Directories (${plan.new_dirs_to_create.length}):`);
      for (const dir of plan.new_dirs_to_create) {
        lines.push(`  CREATE: ${dir}`);
      }
      lines.push('');
    }

    lines.push(`Summary: ${plan.summary}\n`);

    return lines;
  }

  /**
   * Apply the organization plan (AFTER user confirmation)
   */
  async applyPlan(rootDir: string, plan: OrganizationPlan, onProgress?: (msg: string) => void): Promise<boolean> {
    const log = (msg: string) => {
      console.log(msg);
      onProgress?.(msg);
    };

    try {
      // Ensure trash directory exists
      const trashDir = join(rootDir, this.TRASH_DIR);
      mkdirSync(trashDir, { recursive: true });

      // Step 1: Create new directories
      log(`📁 Creating ${plan.new_dirs_to_create.length} directories...`);
      for (const dir of plan.new_dirs_to_create) {
        const fullPath = join(rootDir, dir);
        mkdirSync(fullPath, { recursive: true });
        log(`  ✓ ${dir}`);
      }

      // Step 2: Move files
      log(`🔄 Moving ${plan.moves.length} files...`);
      for (const move of plan.moves) {
        const fromPath = join(rootDir, move.from);
        const toPath = join(rootDir, move.to);

        mkdirSync(dirname(toPath), { recursive: true });
        renameSync(fromPath, toPath);
        log(`  ✓ ${move.from} → ${move.to}`);
      }

      // Step 3: Move redundant files to trash (safer than delete)
      log(`🗑️ Moving ${plan.redundant_files.length} files to trash...`);
      for (const file of plan.redundant_files) {
        const filePath = join(rootDir, file.path);
        const trashPath = join(trashDir, relative(rootDir, filePath));

        mkdirSync(dirname(trashPath), { recursive: true });
        copyFileSync(filePath, trashPath);
        unlinkSync(filePath);
        log(`  ✓ Trashed: ${file.path}`);
      }

      log(`✅ Organization complete`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`❌ Error: ${message}`);
      return false;
    }
  }

  /**
   * Undo - restore from trash
   */
  async undoApply(rootDir: string, onProgress?: (msg: string) => void): Promise<boolean> {
    const log = (msg: string) => {
      console.log(msg);
      onProgress?.(msg);
    };

    try {
      const trashDir = join(rootDir, this.TRASH_DIR);
      const items = readdirSync(trashDir, { recursive: true }) as string[];

      log(`🔄 Restoring ${items.length} files from trash...`);
      let restored = 0;

      for (const item of items) {
        const trashPath = join(trashDir, item);
        const origPath = join(rootDir, item);

        mkdirSync(dirname(origPath), { recursive: true });
        copyFileSync(trashPath, origPath);
        restored++;
      }

      log(`✅ Restored ${restored} files`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`❌ Undo failed: ${message}`);
      return false;
    }
  }

  /**
   * Get extension
   */
  private getExtension(filename: string): string {
    const dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.substring(dot + 1) : '';
  }
}

export const fileOrganizerFeature = new FileOrganizerFeature();
