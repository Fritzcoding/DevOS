import path from 'path';
import fsExtra from 'fs-extra';
import type { RollbackEntry } from '../engine/types';

export class RollbackStore {
  constructor(private readonly rootDir: string) {}

  get storeDir(): string {
    return path.join(this.rootDir, '.devops-lite-organizer');
  }

  get schemaPath(): string {
    return path.join(this.storeDir, 'schema.sql');
  }

  logPath(batchId: string): string {
    return path.join(this.storeDir, `rollback-${batchId}.jsonl`);
  }

  async initialize(): Promise<void> {
    await fsExtra.ensureDir(this.storeDir);
  }

  async append(batchId: string, entry: RollbackEntry): Promise<void> {
    await this.initialize();
    await fsExtra.appendFile(this.logPath(batchId), `${JSON.stringify(entry)}\n`, 'utf8');
  }

  async read(batchId: string): Promise<RollbackEntry[]> {
    const logPath = this.logPath(batchId);
    if (!(await fsExtra.pathExists(logPath))) return [];
    const raw = await fsExtra.readFile(logPath, 'utf8');
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RollbackEntry);
  }
}
