"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeFileOperationExecutor = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const rollback_store_1 = require("../database/rollback-store");
const safety_1 = require("../rules/safety");
class SafeFileOperationExecutor {
    config;
    rollbackStore;
    constructor(rootDir, config = {}) {
        const defaults = (0, safety_1.createDefaultOrganizerConfig)(rootDir);
        this.config = {
            ...defaults,
            ...config,
            featureFlags: { ...defaults.featureFlags, ...config.featureFlags },
            protectedDirectories: config.protectedDirectories || defaults.protectedDirectories,
        };
        this.rollbackStore = new rollback_store_1.RollbackStore(this.config.rootDir);
    }
    async validate(operations) {
        return (0, safety_1.validateOrganizerOperations)(this.config, operations);
    }
    async apply(operations, options = {}) {
        const batchId = crypto_1.default.randomUUID();
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
        const applyErrors = [];
        for (const operation of operations) {
            try {
                if (options.dryRun) {
                    appliedCount++;
                    if (operation.type === 'mkdir') {
                        directoryOperationCount++;
                    }
                    else {
                        fileOperationCount++;
                    }
                    continue;
                }
                await this.applyOne(batchId, operation);
                appliedCount++;
                if (operation.type === 'mkdir') {
                    directoryOperationCount++;
                }
                else {
                    fileOperationCount++;
                }
            }
            catch (error) {
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
    async rollback(batchId) {
        const entries = (await this.rollbackStore.read(batchId)).reverse();
        const errors = [];
        let appliedCount = 0;
        for (const entry of entries) {
            try {
                if (!entry.rollbackFrom || !entry.rollbackTo)
                    continue;
                const rollbackFrom = (0, safety_1.resolveInsideRoot)(this.config.rootDir, entry.rollbackFrom);
                const rollbackTo = (0, safety_1.resolveInsideRoot)(this.config.rootDir, entry.rollbackTo);
                if (!(await fs_extra_1.default.pathExists(rollbackFrom)))
                    continue;
                await fs_extra_1.default.ensureDir(path_1.default.dirname(rollbackTo));
                await this.atomicMove(rollbackFrom, rollbackTo);
                await this.rollbackStore.append(batchId, { ...entry, id: crypto_1.default.randomUUID(), status: 'rolled-back', timestamp: new Date().toISOString() });
                appliedCount++;
            }
            catch (error) {
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
    async applyOne(batchId, operation) {
        if (operation.type === 'mkdir') {
            const target = (0, safety_1.resolveInsideRoot)(this.config.rootDir, operation.to || '');
            await fs_extra_1.default.ensureDir(target);
            await this.record(batchId, operation, undefined, operation.to);
            return;
        }
        if (!operation.from || !operation.to) {
            throw new Error('File operation requires from and to paths.');
        }
        const source = (0, safety_1.resolveInsideRoot)(this.config.rootDir, operation.from);
        const destination = (0, safety_1.resolveInsideRoot)(this.config.rootDir, operation.to);
        if (await fs_extra_1.default.pathExists(destination)) {
            throw new Error(`Destination already exists: ${operation.to}`);
        }
        await fs_extra_1.default.ensureDir(path_1.default.dirname(destination));
        await this.atomicMove(source, destination);
        await this.record(batchId, operation, operation.from, operation.to);
    }
    async atomicMove(source, destination) {
        try {
            await fs_extra_1.default.move(source, destination, { overwrite: false });
        }
        catch (error) {
            if (error?.code !== 'EXDEV')
                throw error;
            await fs_extra_1.default.copy(source, destination, { overwrite: false, errorOnExist: true });
            await fs_extra_1.default.remove(source);
        }
    }
    async record(batchId, operation, from, to) {
        const entry = {
            id: crypto_1.default.randomUUID(),
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
exports.SafeFileOperationExecutor = SafeFileOperationExecutor;
