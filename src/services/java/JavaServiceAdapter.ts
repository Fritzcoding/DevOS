/**
 * Java Service Adapter
 * Communicates with Java backend services via stdin/stdout
 * Manages process lifecycle and message routing
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';
import { logger } from '../logger';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

export class JavaServiceAdapter {
  private process: ReturnType<typeof spawn> | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private isReady = false;
  private buffer = '';
  private javaJarPath: string;

  constructor(javaJarPath?: string) {
    this.javaJarPath = javaJarPath || this.getDefaultJarPath();
  }

  private getDefaultJarPath(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'java', 'target', 'devos-services.jar'),
      path.join(__dirname, '../../java/target/devos-services.jar'),
    ];

    for (const p of possiblePaths) {
      try {
        require('fs').accessSync(p);
        return p;
      } catch (e) {
        // Path doesn't exist, try next
      }
    }

    throw new Error(
      'devos-services.jar not found. Build Java project with: npm run build:java'
    );
  }

  async start(): Promise<void> {
    if (this.isReady) return;

    return new Promise((resolve, reject) => {
      try {
        this.process = spawn('java', ['-jar', this.javaJarPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.process.stdout?.on('data', (data) => this.handleData(data));
        this.process.stderr?.on('data', (data) => {
          logger.debug('JavaService', data.toString().trim());
        });

        this.process.on('error', (err) => {
          logger.error('JavaService', 'Java service process error', undefined, err);
          this.cleanup();
          reject(err);
        });

        this.process.on('exit', (code) => {
          if (code !== 0) {
            logger.warn('JavaService', `Java service exited with code ${code}`);
          }
          this.cleanup();
        });

        setTimeout(() => {
          this.isReady = true;
          resolve();
        }, 1000);
      } catch (err) {
        reject(err);
      }
    });
  }

  async execute<T>(command: string, payload: any, timeout = 30000): Promise<T> {
    if (!this.isReady) {
      await this.start();
    }

    const requestId = randomUUID();
    const message = {
      command,
      requestId,
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Java service request timeout for command: ${command}`));
      }, timeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      try {
        this.process?.stdin?.write(JSON.stringify(message) + '\n');
      } catch (err) {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutHandle);
        reject(err);
      }
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response = JSON.parse(line);
        this.handleResponse(response);
      } catch (err) {
        logger.error(
          'JavaService',
          'Failed to parse Java service response',
          { line },
          err instanceof Error ? err : undefined,
        );
      }
    }
  }

  private handleResponse(response: any): void {
    const { requestId, status } = response;

    if (!requestId || !this.pendingRequests.has(requestId)) {
      logger.warn('JavaService', 'Unexpected response from Java service', { response });
      return;
    }

    const pending = this.pendingRequests.get(requestId)!;
    this.pendingRequests.delete(requestId);
    clearTimeout(pending.timeout);

    if (status === 'success') {
      pending.resolve(response.data);
    } else {
      const error = new Error(response.message || 'Java service error');
      (error as any).code = response.errorCode;
      pending.reject(error);
    }
  }

  private cleanup(): void {
    this.isReady = false;
    this.buffer = '';

    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Java service process terminated'));
    }
    this.pendingRequests.clear();
  }

  async stop(): Promise<void> {
    if (!this.process) return;

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.process?.kill('SIGKILL');
        resolve();
      }, 5000);

      this.process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.process.stdin?.end();
      this.process.kill('SIGTERM');
    });
  }
}

export const javaServiceAdapter = new JavaServiceAdapter();
