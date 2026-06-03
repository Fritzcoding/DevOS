import path from 'path';
import fsExtra from 'fs-extra';
import type { OrganizerConfig, OrganizerOperation } from '../engine/types';

export const DEFAULT_PROTECTED_DIRECTORIES = [
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

export function createDefaultOrganizerConfig(rootDir: string): OrganizerConfig {
  return {
    rootDir: path.resolve(rootDir),
    mode: 'smart-assist',
    confidenceThreshold: 0.9,
    maxOperationsPerRun: 1200,
    protectedDirectories: DEFAULT_PROTECTED_DIRECTORIES,
    featureFlags: {
      enabled: true,
      semanticIndexing: true,
      aiReasoning: false,
      autonomousApply: false,
      watchers: false,
    },
  };
}

export function normalizeRelativePath(input: string): string {
  return input.trim().replace(/^["'`]|["'`]$/g, '').replace(/\\/g, '/').replace(/^\.\/+/, '');
}

export function resolveInsideRoot(rootDir: string, relPath: string): string {
  const root = path.resolve(rootDir);
  const candidate = path.resolve(root, normalizeRelativePath(relPath));
  const rel = path.relative(root, candidate);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path escapes organizer sandbox: ${relPath}`);
  }
  return candidate;
}

export function isProtectedRelativePath(relPath: string, protectedEntries: string[]): boolean {
  const normalized = normalizeRelativePath(relPath).toLowerCase();
  const parts = normalized.split('/').filter(Boolean);
  return protectedEntries.some((entry) => {
    const protectedEntry = normalizeRelativePath(entry).toLowerCase();
    return normalized === protectedEntry || parts.includes(protectedEntry);
  });
}

export async function validateOrganizerOperations(config: OrganizerConfig, operations: OrganizerOperation[]): Promise<string[]> {
  const errors: string[] = [];
  const destinations = new Set<string>();

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

    for (const [label, relPath] of [['source', operation.from], ['destination', operation.to]] as const) {
      if (!relPath) continue;
      try {
        resolveInsideRoot(config.rootDir, relPath);
      } catch (error) {
        errors.push(`${label} ${error instanceof Error ? error.message : String(error)}`);
      }
      const archiveTrashDestination =
        operation.type === 'archive' &&
        label === 'destination' &&
        normalizeRelativePath(relPath).toLowerCase().startsWith('.shimeji-trash/');
      if (!archiveTrashDestination && isProtectedRelativePath(relPath, config.protectedDirectories)) {
        errors.push(`Operation touches protected path (${label}): ${relPath}`);
      }
    }

    if (operation.from && operation.to) {
      const sourceBase = path.posix.basename(normalizeRelativePath(operation.from));
      const destBase = path.posix.basename(normalizeRelativePath(operation.to));
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
    if (!operation.from) continue;
    const sourcePath = resolveInsideRoot(config.rootDir, operation.from);
    if (!(await fsExtra.pathExists(sourcePath))) {
      errors.push(`Source does not exist: ${operation.from}`);
    }
  }

  return errors;
}
