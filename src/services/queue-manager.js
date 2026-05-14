"use strict";
/**
 * Queue Management System
 * Handles task queuing, rate limiting, and circuit breaker pattern
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueManager = exports.QueueManager = void 0;
const p_queue_1 = __importDefault(require("p-queue"));
/**
 * Circuit Breaker tracks consecutive failures
 * Opens circuit (stops accepting tasks) after threshold
 * Re-closes after cooldown period
 */
class CircuitBreaker {
    constructor(taskType) {
        this.failureCount = 0;
        this.isOpen = false;
        this.lastFailTime = 0;
        this.failureThreshold = 5;
        this.cooldownMs = 60000; // 1 minute
        this.taskType = taskType;
    }
    canExecute() {
        if (!this.isOpen)
            return true;
        const timeSinceLastFail = Date.now() - this.lastFailTime;
        if (timeSinceLastFail > this.cooldownMs) {
            // Cooldown expired, try again
            this.isOpen = false;
            this.failureCount = 0;
            console.log(`[Circuit Breaker] ${this.taskType}: CLOSED (cooldown expired)`);
            return true;
        }
        return false;
    }
    recordSuccess() {
        this.failureCount = 0;
        if (this.isOpen) {
            console.log(`[Circuit Breaker] ${this.taskType}: CLOSED (success)`);
            this.isOpen = false;
        }
    }
    recordFailure(error) {
        this.failureCount++;
        this.lastFailTime = Date.now();
        console.warn(`[Circuit Breaker] ${this.taskType}: Failure ${this.failureCount}/${this.failureThreshold}`, error.message);
        if (this.failureCount >= this.failureThreshold) {
            this.isOpen = true;
            console.error(`[Circuit Breaker] ${this.taskType}: OPEN (threshold exceeded, cooldown ${this.cooldownMs}ms)`);
        }
    }
    getStatus() {
        return {
            isOpen: this.isOpen,
            failureCount: this.failureCount,
            timeSinceLastFail: Date.now() - this.lastFailTime,
        };
    }
}
/**
 * Central Queue Manager
 * Creates and manages separate queues for different task types
 */
class QueueManager {
    constructor() {
        // Code Fixer Queue
        // Gemini 2.0 Flash: 60 requests per minute limit
        this.fixer = new p_queue_1.default({
            concurrency: 1,
            interval: 60000, // 1 minute
            intervalCap: 60, // 60 requests per minute
            timeout: 30000,
            autoStart: true,
        });
        // Chat Queue
        // Same as fixer - uses same API
        this.chat = new p_queue_1.default({
            concurrency: 1,
            interval: 60000,
            intervalCap: 60,
            timeout: 30000,
            autoStart: true,
        });
        // Environment Detection Queue
        // Can run faster - local filesystem operations
        this.envDetect = new p_queue_1.default({
            concurrency: 2,
            interval: 10000,
            intervalCap: 20,
            timeout: 10000,
            autoStart: true,
        });
        // Environment Setup Queue
        // Slower - npm install can take minutes
        this.envSetup = new p_queue_1.default({
            concurrency: 1,
            interval: 300000, // 5 minutes
            intervalCap: 1, // One at a time, queued
            timeout: 300000, // 5 minute timeout
            autoStart: true,
        });
        // File Organization Queue
        // Fast local filesystem operations
        this.fileOrg = new p_queue_1.default({
            concurrency: 2,
            interval: 30000,
            intervalCap: 10,
            timeout: 30000,
            autoStart: true,
        });
        // Circuit breakers for API calls
        this.fixerBreaker = new CircuitBreaker('fix-code');
        this.envDetectBreaker = new CircuitBreaker('detect-env');
        this.fileOrgBreaker = new CircuitBreaker('organize-files');
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Log queue events for debugging
        this.fixer.on('add', () => {
            const size = this.fixer.size;
            if (size > 0)
                console.log(`[Queue] fix-code: +1 task (queue size: ${size})`);
        });
        this.fixer.on('next', () => {
            const size = this.fixer.size;
            if (size > 0)
                console.log(`[Queue] fix-code: processing (remaining: ${size})`);
        });
        // Similar logging for other queues...
    }
    /**
     * Add a code fixing task
     */
    async addFixerTask(execute, signal, priority = 0) {
        if (!this.fixerBreaker.canExecute()) {
            const status = this.fixerBreaker.getStatus();
            throw new Error(`Circuit breaker OPEN for fix-code. ` +
                `Wait ${status.timeSinceLastFail}ms before retrying`);
        }
        return this.fixer.add(async () => {
            try {
                const result = await execute(signal || AbortSignal.timeout(30000));
                this.fixerBreaker.recordSuccess();
                return result;
            }
            catch (error) {
                this.fixerBreaker.recordFailure(error);
                throw error;
            }
        }, { priority, signal: signal, timeout: 30000 });
    }
    /**
     * Add a chat task
     */
    async addChatTask(execute, signal) {
        if (!this.fixerBreaker.canExecute()) {
            const status = this.fixerBreaker.getStatus();
            throw new Error(`Circuit breaker OPEN for chat. Wait ${status.timeSinceLastFail}ms before retrying`);
        }
        return this.chat.add(async () => {
            try {
                const result = await execute(signal || AbortSignal.timeout(30000));
                this.fixerBreaker.recordSuccess();
                return result;
            }
            catch (error) {
                this.fixerBreaker.recordFailure(error);
                throw error;
            }
        }, { signal: signal, timeout: 30000 });
    }
    /**
     * Add an environment detection task
     */
    async addEnvDetectTask(execute, signal) {
        if (!this.envDetectBreaker.canExecute()) {
            const status = this.envDetectBreaker.getStatus();
            throw new Error(`Circuit breaker OPEN for detect-env. ` +
                `Wait ${status.timeSinceLastFail}ms before retrying`);
        }
        return this.envDetect.add(async () => {
            try {
                const result = await execute(signal || AbortSignal.timeout(10000));
                this.envDetectBreaker.recordSuccess();
                return result;
            }
            catch (error) {
                this.envDetectBreaker.recordFailure(error);
                throw error;
            }
        }, { signal: signal, timeout: 10000 });
    }
    /**
     * Add an environment setup task (npm install, pip install, etc.)
     */
    async addEnvSetupTask(execute, signal) {
        return this.envSetup.add(async () => {
            try {
                const result = await execute(signal || AbortSignal.timeout(300000));
                return result;
            }
            catch (error) {
                console.error('Setup task failed:', error);
                throw error;
            }
        }, { signal: signal, timeout: 300000 });
    }
    /**
     * Add a file organization task
     */
    async addFileOrgTask(execute, signal) {
        if (!this.fileOrgBreaker.canExecute()) {
            const status = this.fileOrgBreaker.getStatus();
            throw new Error(`Circuit breaker OPEN for organize-files. ` +
                `Wait ${status.timeSinceLastFail}ms before retrying`);
        }
        return this.fileOrg.add(async () => {
            try {
                const result = await execute(signal || AbortSignal.timeout(30000));
                this.fileOrgBreaker.recordSuccess();
                return result;
            }
            catch (error) {
                this.fileOrgBreaker.recordFailure(error);
                throw error;
            }
        }, { signal: signal, timeout: 30000 });
    }
    /**
     * Get queue statistics
     */
    getStats() {
        return {
            fixer: {
                size: this.fixer.size,
                pending: this.fixer.pending,
                circuitBreaker: this.fixerBreaker.getStatus(),
            },
            chat: {
                size: this.chat.size,
                pending: this.chat.pending,
            },
            envDetect: {
                size: this.envDetect.size,
                pending: this.envDetect.pending,
                circuitBreaker: this.envDetectBreaker.getStatus(),
            },
            envSetup: {
                size: this.envSetup.size,
                pending: this.envSetup.pending,
            },
            fileOrg: {
                size: this.fileOrg.size,
                pending: this.fileOrg.pending,
                circuitBreaker: this.fileOrgBreaker.getStatus(),
            },
        };
    }
    /**
     * Pause all queues (for maintenance)
     */
    pauseAll() {
        this.fixer.pause();
        this.chat.pause();
        this.envDetect.pause();
        this.envSetup.pause();
        this.fileOrg.pause();
        console.log('[Queue Manager] All queues paused');
    }
    /**
     * Resume all queues
     */
    resumeAll() {
        this.fixer.start();
        this.chat.start();
        this.envDetect.start();
        this.envSetup.start();
        this.fileOrg.start();
        console.log('[Queue Manager] All queues resumed');
    }
    /**
     * Clear all pending tasks
     */
    clear() {
        this.fixer.clear();
        this.chat.clear();
        this.envDetect.clear();
        this.envSetup.clear();
        this.fileOrg.clear();
        console.log('[Queue Manager] All queues cleared');
    }
}
exports.QueueManager = QueueManager;
// Single global instance
exports.queueManager = new QueueManager();
exports.default = exports.queueManager;
