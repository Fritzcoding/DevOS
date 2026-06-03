import crypto from 'crypto';
import path from 'path';
import fsExtra from 'fs-extra';
import { classifyByHeuristics } from '../classifiers/heuristic-classifier';
import { NoopAIProvider, InMemoryVectorIndex } from '../embeddings/providers';
import { createDefaultOrganizerConfig, isProtectedRelativePath } from '../rules/safety';
import type {
  AIProvider,
  FileMetadata,
  OrganizerConfig,
  OrganizerOperation,
  OrganizerPreview,
  VectorIndex,
} from './types';

export class FileOrganizerService {
  private readonly config: OrganizerConfig;

  constructor(
    rootDir: string,
    private readonly aiProvider: AIProvider = new NoopAIProvider(),
    private readonly vectorIndex: VectorIndex = new InMemoryVectorIndex(),
    config: Partial<OrganizerConfig> = {},
  ) {
    const defaults = createDefaultOrganizerConfig(rootDir);
    this.config = {
      ...defaults,
      ...config,
      featureFlags: { ...defaults.featureFlags, ...config.featureFlags },
      protectedDirectories: config.protectedDirectories || defaults.protectedDirectories,
    };
  }

  async buildPreview(instruction = ''): Promise<OrganizerPreview> {
    if (!this.config.featureFlags.enabled) {
      throw new Error('File organizer is disabled by feature flag.');
    }

    const metadata = await this.scanAndClassify();
    const operations = this.suggestOperations(metadata, instruction);
    const riskLevel = operations.some((op) => op.risk === 'high')
      ? 'high'
      : operations.some((op) => op.risk === 'medium')
        ? 'medium'
        : 'low';

    return {
      generatedAt: new Date().toISOString(),
      rootDir: this.config.rootDir,
      mode: this.config.mode,
      operations,
      metadata,
      summary: `Indexed ${metadata.length} file(s) and generated ${operations.length} safe preview operation(s).`,
      riskLevel,
      warnings: operations
        .filter((op) => op.confidence < this.config.confidenceThreshold)
        .map((op) => `${op.id} is below autonomous confidence threshold.`),
    };
  }

  private async scanAndClassify(): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    const walk = async (dir: string) => {
      const entries = await fsExtra.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const absPath = path.join(dir, entry.name);
        const relPath = path.relative(this.config.rootDir, absPath).replace(/\\/g, '/');
        if (isProtectedRelativePath(relPath, this.config.protectedDirectories)) continue;
        if (entry.isDirectory()) {
          await walk(absPath);
          continue;
        }
        if (!entry.isFile()) continue;
        const stat = await fsExtra.stat(absPath);
        if (stat.size > 5_000_000) continue;

        const heuristic = classifyByHeuristics(relPath);
        const metadata: FileMetadata = {
          relPath,
          absPath,
          sizeBytes: stat.size,
          extension: path.extname(entry.name).toLowerCase(),
          modifiedAt: stat.mtime.toISOString(),
          category: heuristic.category,
          tags: heuristic.tags,
        };

        if (this.config.featureFlags.semanticIndexing) {
          const vector = await this.aiProvider.embed?.(`${relPath}\n${metadata.category}\n${metadata.tags.join(',')}`);
          if (vector) {
            metadata.embeddingId = crypto.createHash('sha256').update(relPath).digest('hex');
            await this.vectorIndex.upsert(metadata.embeddingId, vector, { path: relPath, category: metadata.category });
          }
        }

        files.push(metadata);
      }
    };

    await walk(this.config.rootDir);
    return files;
  }

  private suggestOperations(files: FileMetadata[], instruction: string): OrganizerOperation[] {
    const lowerInstruction = instruction.toLowerCase();
    const shouldSuggestByCategory =
      lowerInstruction.includes('organize') ||
      lowerInstruction.includes('sort') ||
      lowerInstruction.includes('professional') ||
      lowerInstruction.trim() === '';

    if (!shouldSuggestByCategory) return [];

    const targets: Partial<Record<FileMetadata['category'], string>> = {
      document: 'docs',
      image: 'assets/images',
      video: 'assets/video',
      dataset: 'data',
      archive: 'archives',
      logs: 'logs',
      research: 'docs/research',
      academic: 'docs/academic',
      financial: 'docs/financial',
      'ai-model': 'models',
      'development-asset': 'assets',
    };

    return files.flatMap((file) => {
      const targetDir = targets[file.category];
      if (!targetDir) return [];
      if (file.relPath.includes('/')) return [];
      const destination = `${targetDir}/${path.posix.basename(file.relPath)}`;
      if (destination === file.relPath) return [];
      return [{
        id: crypto.createHash('sha256').update(`${file.relPath}->${destination}`).digest('hex'),
        type: 'move',
        from: file.relPath,
        to: destination,
        reason: `Category "${file.category}" maps to ${targetDir}; suggested in preview mode only.`,
        confidence: 0.91,
        risk: 'low',
        reversible: true,
      } satisfies OrganizerOperation];
    });
  }
}
