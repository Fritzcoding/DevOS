"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
// Detect if running in Node.js or browser
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const fs = isNode ? require('fs') : null;
const path = isNode ? require('path') : null;
const os = isNode ? require('os') : null;
/**
 * Centralized logging system that writes to file and exposes to frontend debug panel.
 * Automatically rotates logs to keep only recent sessions.
 */
class Logger {
    constructor() {
        this.logsDir = isNode ? path?.join(os?.homedir(), '.devops-lite-logs') : undefined;
        this.maxEntriesInMemory = 256;
        this.maxLogFiles = 10;
        this.entries = [];
        this.logFile = '';
        this.onNewEntry = null;
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
    ensureLogsDir() {
        if (!isNode || !fs || !this.logsDir)
            return;
        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
        }
        catch (e) {
            console.error(`Failed to create logs dir: ${this.logsDir}`, e);
        }
    }
    /**
     * Get path to current log file (named by session timestamp)
     */
    getLogFilePath() {
        if (!isNode || !path || !this.logsDir)
            return '';
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
    pruneOldLogs() {
        if (!isNode || !fs || !this.logsDir)
            return;
        try {
            if (!fs.existsSync(this.logsDir))
                return;
            const files = fs.readdirSync(this.logsDir)
                .filter(f => f.startsWith('app-') && f.endsWith('.log'))
                .sort()
                .reverse();
            if (files.length > this.maxLogFiles) {
                for (let i = this.maxLogFiles; i < files.length; i++) {
                    const filePath = path.join(this.logsDir, files[i]);
                    try {
                        fs.unlinkSync(filePath);
                    }
                    catch (e) {
                        console.error(`Failed to delete old log file: ${filePath}`, e);
                    }
                }
            }
        }
        catch (e) {
            console.error('Failed to prune old logs', e);
        }
    }
    /**
     * Load recent logs from disk (for session restoration on app restart)
     */
    loadRecentLogs() {
        if (!isNode || !fs || !this.logFile)
            return;
        try {
            if (!fs.existsSync(this.logFile))
                return;
            const content = fs.readFileSync(this.logFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            // Keep only last maxEntriesInMemory entries
            for (const line of lines.slice(-this.maxEntriesInMemory)) {
                try {
                    const entry = JSON.parse(line);
                    this.entries.push(entry);
                }
                catch (e) {
                    // Skip malformed entries
                }
            }
        }
        catch (e) {
            console.error('Failed to load recent logs', e);
        }
    }
    /**
     * Internal log method
     */
    log(level, source, message, context, stack) {
        const entry = {
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
            }
            catch (e) {
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
        }
        else {
            console[level === 'error' ? 'error' : level]?.(consoleMessage);
        }
    }
    /**
     * Public logging methods
     */
    debug(source, message, context) {
        this.log('debug', source, message, context);
    }
    info(source, message, context) {
        this.log('info', source, message, context);
    }
    warn(source, message, context) {
        this.log('warn', source, message, context);
    }
    error(source, message, context, error) {
        const stack = error?.stack;
        this.log('error', source, message, context, stack);
    }
    /**
     * Get all entries
     */
    getEntries() {
        return [...this.entries];
    }
    /**
     * Get entries filtered by level
     */
    getEntriesByLevel(level) {
        return this.entries.filter(e => e.level === level);
    }
    /**
     * Get entries filtered by source
     */
    getEntriesBySource(source) {
        return this.entries.filter(e => e.source.includes(source));
    }
    /**
     * Search entries by message
     */
    search(query) {
        const q = query.toLowerCase();
        return this.entries.filter(e => e.message.toLowerCase().includes(q) ||
            e.source.toLowerCase().includes(q));
    }
    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
        if (isNode && fs && this.logFile) {
            try {
                fs.unlinkSync(this.logFile);
            }
            catch (e) {
                // File might not exist
            }
        }
    }
    /**
     * Set callback for new entries (called from React debug panel)
     */
    setOnNewEntry(callback) {
        this.onNewEntry = callback;
    }
    /**
     * Get log file path (for UI to link to log file)
     */
    getLogFilePath_() {
        return this.logFile;
    }
    /**
     * Get logs directory path
     */
    getLogsDirPath() {
        return this.logsDir;
    }
}
exports.Logger = Logger;
// Export singleton instance
exports.logger = new Logger();
