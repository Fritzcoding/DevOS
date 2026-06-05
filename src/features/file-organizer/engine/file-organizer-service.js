"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileOrganizerService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const heuristic_classifier_1 = require("../classifiers/heuristic-classifier");
const providers_1 = require("../embeddings/providers");
const safety_1 = require("../rules/safety");
class FileOrganizerService {
    aiProvider;
    vectorIndex;
    config;
    constructor(rootDir, aiProvider = new providers_1.NoopAIProvider(), vectorIndex = new providers_1.InMemoryVectorIndex(), config = {}) {
        this.aiProvider = aiProvider;
        this.vectorIndex = vectorIndex;
        const defaults = (0, safety_1.createDefaultOrganizerConfig)(rootDir);
        this.config = {
            ...defaults,
            ...config,
            featureFlags: { ...defaults.featureFlags, ...config.featureFlags },
            protectedDirectories: config.protectedDirectories || defaults.protectedDirectories,
        };
    }
    async buildPreview(instruction = '') {
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
    async scanAndClassify() {
        const files = [];
        const walk = async (dir) => {
            const entries = await fs_extra_1.default.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const absPath = path_1.default.join(dir, entry.name);
                const relPath = path_1.default.relative(this.config.rootDir, absPath).replace(/\\/g, '/');
                if ((0, safety_1.isProtectedRelativePath)(relPath, this.config.protectedDirectories))
                    continue;
                if (entry.isDirectory()) {
                    await walk(absPath);
                    continue;
                }
                if (!entry.isFile())
                    continue;
                const stat = await fs_extra_1.default.stat(absPath);
                if (stat.size > 5_000_000)
                    continue;
                const heuristic = (0, heuristic_classifier_1.classifyByHeuristics)(relPath);
                const metadata = {
                    relPath,
                    absPath,
                    sizeBytes: stat.size,
                    extension: path_1.default.extname(entry.name).toLowerCase(),
                    modifiedAt: stat.mtime.toISOString(),
                    category: heuristic.category,
                    tags: heuristic.tags,
                };
                if (this.config.featureFlags.semanticIndexing) {
                    const vector = await this.aiProvider.embed?.(`${relPath}\n${metadata.category}\n${metadata.tags.join(',')}`);
                    if (vector) {
                        metadata.embeddingId = crypto_1.default.createHash('sha256').update(relPath).digest('hex');
                        await this.vectorIndex.upsert(metadata.embeddingId, vector, { path: relPath, category: metadata.category });
                    }
                }
                files.push(metadata);
            }
        };
        await walk(this.config.rootDir);
        return files;
    }
    suggestOperations(files, instruction) {
        const lowerInstruction = instruction.toLowerCase();
        const shouldSuggestByCategory = lowerInstruction.includes('organize') ||
            lowerInstruction.includes('sort') ||
            lowerInstruction.includes('professional') ||
            lowerInstruction.trim() === '';
        if (!shouldSuggestByCategory)
            return [];
        const targets = {
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
            if (!targetDir)
                return [];
            if (file.relPath.includes('/'))
                return [];
            const destination = `${targetDir}/${path_1.default.posix.basename(file.relPath)}`;
            if (destination === file.relPath)
                return [];
            return [{
                    id: crypto_1.default.createHash('sha256').update(`${file.relPath}->${destination}`).digest('hex'),
                    type: 'move',
                    from: file.relPath,
                    to: destination,
                    reason: `Category "${file.category}" maps to ${targetDir}; suggested in preview mode only.`,
                    confidence: 0.91,
                    risk: 'low',
                    reversible: true,
                }];
        });
    }
}
exports.FileOrganizerService = FileOrganizerService;
