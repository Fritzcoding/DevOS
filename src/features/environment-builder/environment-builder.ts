/**
 * Environment Builder Feature
 * Scans project directory, detects framework, generates setup steps
 */

import { execSync } from 'child_process';
import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';
import { eventBus } from '../../core/event-bus';
import { stateMachine } from '../../core/state-machine';
import { aiClient } from '../../services/ai/ai-client';

export interface ProjectScan {
  root: string;
  files: Array<{ name: string; rel_path: string; size_kb: number }>;
  has_pom: boolean;
  has_package_json: boolean;
  has_requirements: boolean;
  has_cargo: boolean;
  has_go_mod: boolean;
  config_files: string[];
}

export interface SetupStep {
  step: number;
  description: string;
  command: string;
  platform: 'mac' | 'windows' | 'linux' | 'universal';
  required: boolean;
}

export interface EnvironmentAnalysis {
  detected_type: string;
  missing_tools: string[];
  setup_steps: SetupStep[];
  env_vars_needed: string[];
  estimated_minutes: number;
  summary?: string;
}

class EnvironmentBuilderFeature {
  private isProcessing = false;
  private currentProjectScan: ProjectScan | null = null;

  /**
   * Scan a project directory (up to 3 levels deep)
   */
  scanProject(rootDir: string, maxDepth: number = 3): ProjectScan {
    console.log(`🔍 Environment Builder: Scanning ${rootDir}...`);

    const files: Array<{ name: string; rel_path: string; size_kb: number }> = [];
    const configFiles: string[] = [];

    const walkDir = (dir: string, depth: number = 0) => {
      if (depth > maxDepth) return;

      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const relPath = fullPath.replace(rootDir, '').replace(/\\/g, '/').slice(1);

          // Skip hidden and node_modules
          if (item.startsWith('.') || item === 'node_modules' || item === '__pycache__') {
            continue;
          }

          const stat = lstatSync(fullPath);
          if (stat.isFile()) {
            const sizeKb = Math.ceil(stat.size / 1024);
            files.push({ name: item, rel_path: relPath, size_kb: sizeKb });

            // Track config files
            if (this.isConfigFile(item)) {
              configFiles.push(relPath);
            }
          } else if (stat.isDirectory() && depth < maxDepth) {
            walkDir(fullPath, depth + 1);
          }
        }
      } catch (error) {
        console.warn(`Error scanning ${dir}:`, error);
      }
    };

    walkDir(rootDir);

    const scan: ProjectScan = {
      root: rootDir,
      files,
      has_pom: files.some((f) => f.name === 'pom.xml'),
      has_package_json: files.some((f) => f.name === 'package.json'),
      has_requirements: files.some((f) => f.name === 'requirements.txt'),
      has_cargo: files.some((f) => f.name === 'Cargo.toml'),
      has_go_mod: files.some((f) => f.name === 'go.mod'),
      config_files: configFiles,
    };

    this.currentProjectScan = scan;
    return scan;
  }

  /**
   * Analyze environment using AI
   */
  async analyzeEnvironment(projectScan: ProjectScan): Promise<EnvironmentAnalysis | null> {
    if (this.isProcessing) {
      console.warn('Environment builder already processing');
      return null;
    }

    if (!aiClient.hasApiKey()) {
      eventBus.emit({
        type: 'FEATURE_FAILED',
        feature: 'environment',
        error: 'Gemini API key not configured',
      });
      return null;
    }

    try {
      this.isProcessing = true;
      await stateMachine.setState('environment-running');

      const response = await aiClient.analyzeEnvironment(projectScan);

      if (!response.success) {
        eventBus.emit({
          type: 'FEATURE_FAILED',
          feature: 'environment',
          error: response.error || 'Unknown error',
        });
        return null;
      }

      const analysis = response.data as EnvironmentAnalysis;

      eventBus.emit({
        type: 'FEATURE_COMPLETE',
        feature: 'environment',
        result: analysis,
      });

      await stateMachine.setState('idle');

      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      eventBus.emit({
        type: 'FEATURE_FAILED',
        feature: 'environment',
        error: message,
      });
      await stateMachine.setState('idle');
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a setup step
   */
  async executeStep(step: SetupStep, onOutput?: (line: string) => void): Promise<boolean> {
    const platform = process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'windows' : 'linux';

    // Skip if step is not for this platform (unless universal)
    if (step.platform !== 'universal' && step.platform !== platform) {
      console.log(`⏭️ Skipping step for ${step.platform} (current: ${platform})`);
      return true;
    }

    console.log(`▶️ Executing: ${step.command}`);
    onOutput?.(`$ ${step.command}\n`);

    try {
      const output = execSync(step.command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      onOutput?.(output);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onOutput?.(`❌ Error: ${message}\n`);
      return !step.required; // Only fail if step is required
    }
  }

  /**
   * Check if a tool is available on the system
   */
  checkToolAvailable(tool: string): boolean {
    try {
      const command = process.platform === 'win32' ? `where ${tool}` : `which ${tool}`;
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect config file types
   */
  private isConfigFile(filename: string): boolean {
    const configPatterns = [
      'pom.xml',
      'package.json',
      'requirements.txt',
      'Cargo.toml',
      'go.mod',
      'composer.json',
      'Gemfile',
      'build.gradle',
      'Makefile',
      '.env',
      '.dockerignore',
      'Dockerfile',
    ];
    return configPatterns.includes(filename);
  }

  /**
   * Get current scan
   */
  getCurrentScan(): ProjectScan | null {
    return this.currentProjectScan;
  }
}

export const environmentBuilderFeature = new EnvironmentBuilderFeature();
