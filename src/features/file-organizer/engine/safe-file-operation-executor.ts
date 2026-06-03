import crypto from 'crypto';
import path from 'path';
import fsExtra from 'fs-extra';
import { RollbackStore } from '../database/rollback-store';
import { createDefaultOrganizerConfig, resolveInsideRoot, validateOrganizerOperations } from '../rules/safety';
import type { ApplyResult, OrganizerConfig, OrganizerOperation, RollbackEntry } from './types';

export class SafeFileOperationExecutor {
  private readonly config: OrganizerConfig;
  private readonly rollbackStore: RollbackStore;

  constructor(rootDir: string, config: Partial<OrganizerConfig> = {}) {
    const defaults = createDefaultOrganizerConfig(rootDir);
    this.config = {
      ...defaults,
      ...config,
      featureFlags: { ...defaults.featureFlags, ...config.featureFlags },
      protectedDirectories: config.protectedDirectories || defaults.protectedDirectories,
    };
    this.rollbackStore = new RollbackStore(this.config.rootDir);
  }

  async validate(operations: OrganizerOperation[]): Promise<string[]> {
    return validateOrganizerOperations(this.config, operations);
  }

  async apply(operations: OrganizerOperation[], options: { dryRun?: boolean } = {}): Promise<ApplyResult> {
    const batchId = crypto.randomUUID();
    const errors = await this.validate(operations);
    if (errors.length) {
      return {
        success: false,
        appliedCount: 0,
        skippedCount: operations.length,
        rollbackBatchId: batchId,
        rollbackLogPath: this.rollbackStore.logPath(batchId),
        errors,
      };
    }

    await this.rollbackStore.initialize();
    let appliedCount = 0;
    let fileOperationCount = 0;
    let directoryOperationCount = 0;
    const applyErrors: string[] = [];

    for (const operation of operations) {
      try {
        if (options.dryRun) {
          appliedCount++;
          if (operation.type === 'mkdir') {
            directoryOperationCount++;
          } else {
            fileOperationCount++;
          }
          continue;
        }
        await this.applyOne(batchId, operation);
        appliedCount++;
        if (operation.type === 'mkdir') {
          directoryOperationCount++;
        } else {
          fileOperationCount++;
        }
      } catch (error) {
        applyErrors.push(`${operation.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: applyErrors.length === 0,
      appliedCount,
      skippedCount: operations.length - appliedCount,
      fileOperationCount,
      directoryOperationCount,
      rollbackBatchId: batchId,
      rollbackLogPath: this.rollbackStore.logPath(batchId),
      errors: applyErrors,
    };
  }

  async rollback(batchId: string): Promise<ApplyResult> {
    const entries = (await this.rollbackStore.read(batchId)).reverse();
    const errors: string[] = [];
    let appliedCount = 0;

    for (const entry of entries) {
      try {
        if (!entry.rollbackFrom || !entry.rollbackTo) continue;
        const rollbackFrom = resolveInsideRoot(this.config.rootDir, entry.rollbackFrom);
        const rollbackTo = resolveInsideRoot(this.config.rootDir, entry.rollbackTo);
        if (!(await fsExtra.pathExists(rollbackFrom))) continue;
        await fsExtra.ensureDir(path.dirname(rollbackTo));
        await this.atomicMove(rollbackFrom, rollbackTo);
        await this.rollbackStore.append(batchId, { ...entry, id: crypto.randomUUID(), status: 'rolled-back', timestamp: new Date().toISOString() });
        appliedCount++;
      } catch (error) {
        errors.push(`${entry.operationId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      appliedCount,
      skippedCount: entries.length - appliedCount,
      rollbackBatchId: batchId,
      rollbackLogPath: this.rollbackStore.logPath(batchId),
      errors,
    };
  }

  private async applyOne(batchId: string, operation: OrganizerOperation): Promise<void> {
    if (operation.type === 'mkdir') {
      const target = resolveInsideRoot(this.config.rootDir, operation.to || '');
      await fsExtra.ensureDir(target);
      await this.record(batchId, operation, undefined, operation.to);
      return;
    }

    if (!operation.from || !operation.to) {
      throw new Error('File operation requires from and to paths.');
    }

    const source = resolveInsideRoot(this.config.rootDir, operation.from);
    const destination = resolveInsideRoot(this.config.rootDir, operation.to);
    if (await fsExtra.pathExists(destination)) {
      throw new Error(`Destination already exists: ${operation.to}`);
    }

    await fsExtra.ensureDir(path.dirname(destination));
    await this.atomicMove(source, destination);
    await this.record(batchId, operation, operation.from, operation.to);
  }

  private async atomicMove(source: string, destination: string): Promise<void> {
    try {
      await fsExtra.move(source, destination, { overwrite: false });
    } catch (error: any) {
      if (error?.code !== 'EXDEV') throw error;
      await fsExtra.copy(source, destination, { overwrite: false, errorOnExist: true });
      await fsExtra.remove(source);
    }
  }

  private async record(batchId: string, operation: OrganizerOperation, from?: string, to?: string): Promise<void> {
    const entry: RollbackEntry = {
      id: crypto.randomUUID(),
      operationId: operation.id,
      type: operation.type,
      from,
      to,
      rollbackFrom: to,
      rollbackTo: from,
      timestamp: new Date().toISOString(),
      status: 'applied',
    };
    await this.rollbackStore.append(batchId, entry);
  }
}
