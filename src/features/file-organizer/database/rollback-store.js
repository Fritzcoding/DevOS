"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbackStore = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class RollbackStore {
    rootDir;
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    get storeDir() {
        return path_1.default.join(this.rootDir, '.devops-lite-organizer');
    }
    get schemaPath() {
        return path_1.default.join(this.storeDir, 'schema.sql');
    }
    logPath(batchId) {
        return path_1.default.join(this.storeDir, `rollback-${batchId}.jsonl`);
    }
    async initialize() {
        await fs_extra_1.default.ensureDir(this.storeDir);
    }
    async append(batchId, entry) {
        await this.initialize();
        await fs_extra_1.default.appendFile(this.logPath(batchId), `${JSON.stringify(entry)}\n`, 'utf8');
    }
    async read(batchId) {
        const logPath = this.logPath(batchId);
        if (!(await fs_extra_1.default.pathExists(logPath)))
            return [];
        const raw = await fs_extra_1.default.readFile(logPath, 'utf8');
        return raw
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => JSON.parse(line));
    }
}
exports.RollbackStore = RollbackStore;
