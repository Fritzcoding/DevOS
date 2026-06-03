"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROTECTED_DIRECTORIES = void 0;
exports.createDefaultOrganizerConfig = createDefaultOrganizerConfig;
exports.normalizeRelativePath = normalizeRelativePath;
exports.resolveInsideRoot = resolveInsideRoot;
exports.isProtectedRelativePath = isProtectedRelativePath;
exports.validateOrganizerOperations = validateOrganizerOperations;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.DEFAULT_PROTECTED_DIRECTORIES = [
    '.git',
    'node_modules',
    '.shimeji-trash',
    '.devops-lite-organizer',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    '.vite',
    '.env',
    '.env.local',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'tsconfig.json',
];
function createDefaultOrganizerConfig(rootDir) {
    return {
        rootDir: path_1.default.resolve(rootDir),
        mode: 'smart-assist',
        confidenceThreshold: 0.9,
        maxOperationsPerRun: 1200,
        protectedDirectories: exports.DEFAULT_PROTECTED_DIRECTORIES,
        featureFlags: {
            enabled: true,
            semanticIndexing: true,
            aiReasoning: false,
            autonomousApply: false,
            watchers: false,
        },
    };
}
function normalizeRelativePath(input) {
    return input.trim().replace(/^["'`]|["'`]$/g, '').replace(/\\/g, '/').replace(/^\.\/+/, '');
}
function resolveInsideRoot(rootDir, relPath) {
    const root = path_1.default.resolve(rootDir);
    const candidate = path_1.default.resolve(root, normalizeRelativePath(relPath));
    const rel = path_1.default.relative(root, candidate);
    if (rel.startsWith('..') || path_1.default.isAbsolute(rel)) {
        throw new Error(`Path escapes organizer sandbox: ${relPath}`);
    }
    return candidate;
}
function isProtectedRelativePath(relPath, protectedEntries) {
    const normalized = normalizeRelativePath(relPath).toLowerCase();
    const parts = normalized.split('/').filter(Boolean);
    return protectedEntries.some((entry) => {
        const protectedEntry = normalizeRelativePath(entry).toLowerCase();
        return normalized === protectedEntry || parts.includes(protectedEntry);
    });
}
async function validateOrganizerOperations(config, operations) {
    const errors = [];
    const destinations = new Set();
    if (!config.featureFlags.enabled) {
        return ['File organizer feature flag is disabled.'];
    }
    if (operations.length > config.maxOperationsPerRun) {
        errors.push(`Plan has ${operations.length} operations; maximum is ${config.maxOperationsPerRun}.`);
    }
    for (const operation of operations) {
        if (operation.confidence < config.confidenceThreshold && config.mode === 'autonomous') {
            errors.push(`Autonomous operation below confidence threshold: ${operation.id}`);
        }
        for (const [label, relPath] of [['source', operation.from], ['destination', operation.to]]) {
            if (!relPath)
                continue;
            try {
                resolveInsideRoot(config.rootDir, relPath);
            }
            catch (error) {
                errors.push(`${label} ${error instanceof Error ? error.message : String(error)}`);
            }
            const archiveTrashDestination = operation.type === 'archive' &&
                label === 'destination' &&
                normalizeRelativePath(relPath).toLowerCase().startsWith('.shimeji-trash/');
            if (!archiveTrashDestination && isProtectedRelativePath(relPath, config.protectedDirectories)) {
                errors.push(`Operation touches protected path (${label}): ${relPath}`);
            }
        }
        if (operation.from && operation.to) {
            const sourceBase = path_1.default.posix.basename(normalizeRelativePath(operation.from));
            const destBase = path_1.default.posix.basename(normalizeRelativePath(operation.to));
            if (operation.type === 'move' && sourceBase !== destBase) {
                errors.push(`Move operation cannot rename without explicit rename type: ${operation.from} -> ${operation.to}`);
            }
            const key = normalizeRelativePath(operation.to).toLowerCase();
            if (destinations.has(key)) {
                errors.push(`Multiple operations target the same destination: ${operation.to}`);
            }
            destinations.add(key);
        }
    }
    for (const operation of operations) {
        if (!operation.from)
            continue;
        const sourcePath = resolveInsideRoot(config.rootDir, operation.from);
        if (!(await fs_extra_1.default.pathExists(sourcePath))) {
            errors.push(`Source does not exist: ${operation.from}`);
        }
    }
    return errors;
}
