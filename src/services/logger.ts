export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string; // e.g., "CodeFixer", "EnvironmentBuilder", "IPC"
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

// Detect if running in Node.js or browser
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const fs = isNode ? require('fs') : null;
const path = isNode ? require('path') : null;
const os = isNode ? require('os') : null;

/**
 * Centralized logging system that writes to file and exposes to frontend debug panel.
 * Automatically rotates logs to keep only recent sessions.
 */
export class Logger {
  private readonly logsDir = isNode ? path?.join(os?.homedir(), '.devops-lite-logs') : undefined;
  private readonly maxEntriesInMemory = 256;
  private readonly maxLogFiles = 10;
  private entries: LogEntry[] = [];
  private logFile: string = '';
  private onNewEntry: ((entry: LogEntry) => void) | null = null;

  constructor() {
    if (isNode) {
      this.ensureLogsDir();
      this.logFile = this.getLogFilePath();
    }
    this.pruneOldLogs();
    this.loadRecentLogs();
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDir(): void {
    if (!isNode || !fs || !this.logsDir) return;
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (e) {
      console.error(`Failed to create logs dir: ${this.logsDir}`, e);
    }
  }

  /**
   * Get path to current log file (named by session timestamp)
   */
  private getLogFilePath(): string {
    if (!isNode || !path || !this.logsDir) return '';
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.getHours().toString().padStart(2, '0') +
                    now.getMinutes().toString().padStart(2, '0') +
                    now.getSeconds().toString().padStart(2, '0');
    return path.join(this.logsDir, `app-${dateStr}-${timeStr}.log`);
  }

  /**
   * Prune old log files, keeping only the most recent
   */
  private pruneOldLogs(): void {
    if (!isNode || !fs || !this.logsDir) return;
    try {
      if (!fs.existsSync(this.logsDir)) return;

      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'))
        .sort()
        .reverse();

      if (files.length > this.maxLogFiles) {
        for (let i = this.maxLogFiles; i < files.length; i++) {
          const filePath = path.join(this.logsDir, files[i]);
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error(`Failed to delete old log file: ${filePath}`, e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to prune old logs', e);
    }
  }

  /**
   * Load recent logs from disk (for session restoration on app restart)
   */
  private loadRecentLogs(): void {
    if (!isNode || !fs || !this.logFile) return;
    try {
      if (!fs.existsSync(this.logFile)) return;

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Keep only last maxEntriesInMemory entries
      for (const line of lines.slice(-this.maxEntriesInMemory)) {
        try {
          const entry = JSON.parse(line);
          this.entries.push(entry);
        } catch (e) {
          // Skip malformed entries
        }
      }
    } catch (e) {
      console.error('Failed to load recent logs', e);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, source: string, message: string, context?: Record<string, unknown>, stack?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      context,
      stack,
    };

    // Add to memory
    this.entries.push(entry);
    if (this.entries.length > this.maxEntriesInMemory) {
      this.entries.shift();
    }

    // Write to file (Node.js only)
    if (isNode && fs && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
      } catch (e) {
        console.error('Failed to write log to file', e);
      }
    }

    // Notify listeners (debug panel in React)
    if (this.onNewEntry) {
      this.onNewEntry(entry);
    }

    // Also log to console for development
    const consoleMessage = `[${entry.timestamp}] [${level.toUpperCase()}] [${source}] ${message}`;
    if (context) {
      console[level === 'error' ? 'error' : level]?.(consoleMessage, context);
    } else {
      console[level === 'error' ? 'error' : level]?.(consoleMessage);
    }
  }

  /**
   * Public logging methods
   */
  public debug(source: string, message: string, context?: Record<string, unknown>): void {
    this.log('debug', source, message, context);
  }

  public info(source: string, message: string, context?: Record<string, unknown>): void {
    this.log('info', source, message, context);
  }

  public warn(source: string, message: string, context?: Record<string, unknown>): void {
    this.log('warn', source, message, context);
  }

  public error(source: string, message: string, context?: Record<string, unknown>, error?: Error): void {
    const stack = error?.stack;
    this.log('error', source, message, context, stack);
  }

  /**
   * Get all entries
   */
  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by level
   */
  public getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(e => e.level === level);
  }

  /**
   * Get entries filtered by source
   */
  public getEntriesBySource(source: string): LogEntry[] {
    return this.entries.filter(e => e.source.includes(source));
  }

  /**
   * Search entries by message
   */
  public search(query: string): LogEntry[] {
    const q = query.toLowerCase();
    return this.entries.filter(
      e => e.message.toLowerCase().includes(q) ||
           e.source.toLowerCase().includes(q)
    );
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    this.entries = [];
    if (isNode && fs && this.logFile) {
      try {
        fs.unlinkSync(this.logFile);
      } catch (e) {
        // File might not exist
      }
    }
  }

  /**
   * Set callback for new entries (called from React debug panel)
   */
  public setOnNewEntry(callback: (entry: LogEntry) => void): void {
    this.onNewEntry = callback;
  }

  /**
   * Get log file path (for UI to link to log file)
   */
  public getLogFilePath_(): string {
    return this.logFile;
  }

  /**
   * Get logs directory path
   */
  public getLogsDirPath(): string {
    return this.logsDir;
  }
}

// Export singleton instance
export const logger = new Logger();
