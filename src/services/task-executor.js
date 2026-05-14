"use strict";
/**
 * Task Executor
 * Wraps async operations with timeout, error handling, and logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyError = classifyError;
exports.executeWithTimeout = executeWithTimeout;
exports.executeBatch = executeBatch;
exports.executeWithRetry = executeWithRetry;
const ipc_types_1 = require("../ipc-types");
const logger_1 = require("./logger");
/**
 * Error classification helper
 */
function classifyError(error) {
    const message = error.message || error.toString();
    const code = error.code || '';
    // Rate limiting
    if (message.includes('RATE_LIMIT') ||
        message.includes('429') ||
        message.includes('quota')) {
        return ipc_types_1.IPCErrorCode.RATE_LIMITED;
    }
    // Timeout
    if (message.includes('timeout') ||
        message.includes('TIMEOUT') ||
        error.name === 'AbortError') {
        return ipc_types_1.IPCErrorCode.TIMEOUT;
    }
    // File operations
    if (message.includes('ENOENT') ||
        message.includes('not found') ||
        code === 'ENOENT') {
        return ipc_types_1.IPCErrorCode.FILE_NOT_FOUND;
    }
    if (message.includes('EACCES') ||
        message.includes('EPERM') ||
        message.includes('permission denied') ||
        code === 'EACCES' ||
        code === 'EPERM') {
        return ipc_types_1.IPCErrorCode.PERMISSION_DENIED;
    }
    // API authentication
    if (message.includes('API_KEY') ||
        message.includes('INVALID_API_KEY') ||
        message.includes('AUTHENTICATION_FAILED')) {
        return ipc_types_1.IPCErrorCode.API_KEY_MISSING;
    }
    // API errors
    if (message.includes('API') ||
        message.includes('HTTP') ||
        message.includes('network')) {
        return ipc_types_1.IPCErrorCode.API_CALL_FAILED;
    }
    // Parameter validation
    if (message.includes('Invalid') ||
        message.includes('required') ||
        message.includes('parameter')) {
        return ipc_types_1.IPCErrorCode.INVALID_PARAMS;
    }
    // Cancelled
    if (message.includes('cancelled') || message.includes('aborted')) {
        return ipc_types_1.IPCErrorCode.CANCELLED;
    }
    return ipc_types_1.IPCErrorCode.UNKNOWN;
}
/**
 * Execute a task with proper error handling and timeout
 *
 * @param context - Execution context (requestId, taskType, etc.)
 * @param execute - Async function to execute
 * @param timeout - Max execution time (ms)
 * @returns Execution result with proper error classification
 */
async function executeWithTimeout(context, execute, timeout) {
    const startTime = Date.now();
    try {
        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeout);
        try {
            // Execute with signal
            const data = await execute(abortController.signal);
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            logger_1.logger.info('TaskExecutor', `Task completed: ${context.taskType}`, {
                duration,
                requestId: context.requestId,
            });
            return {
                success: true,
                data,
                duration,
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorCode = classifyError(error);
        logger_1.logger.error('TaskExecutor', `Task failed: ${context.taskType}`, {
            errorCode,
            duration,
            requestId: context.requestId,
            errorMessage: error.message,
        }, error);
        const ipcError = {
            code: errorCode,
            message: error.message || 'Unknown error',
            retryable: isRetryable(errorCode),
            recoverySteps: getRecoverySteps(errorCode),
        };
        return {
            success: false,
            error: ipcError,
            duration,
        };
    }
}
/**
 * Determine if error is retryable
 */
function isRetryable(code) {
    const retryableCodes = [
        'RATE_LIMITED',
        'TIMEOUT',
        'API_CALL_FAILED',
        'CANCELLED', // User can retry
    ];
    return retryableCodes.includes(code);
}
/**
 * Get recovery steps for each error type
 */
function getRecoverySteps(code) {
    const steps = {
        TIMEOUT: [
            'Task took too long (> 30s)',
            'Try with less code or simpler input',
            'Check your internet connection',
            'Try again with a longer timeout',
        ],
        CANCELLED: ['Task was cancelled', 'Try again to restart'],
        RATE_LIMITED: [
            'Too many requests to API',
            'Wait 60 seconds before retrying',
            'Consider using a different AI model',
            'Try with shorter code snippets',
        ],
        INVALID_PARAMS: [
            'One or more parameters are invalid',
            'Check required fields: code, language, prompt',
            'Verify parameter types are correct',
        ],
        FILE_NOT_FOUND: [
            'File does not exist at specified path',
            'Check the file path is correct',
            'Verify file has not been deleted',
            'Ensure you have read permissions',
        ],
        PERMISSION_DENIED: [
            'Do not have permission to access file/folder',
            'Try running as administrator',
            'Check file/folder permissions',
            'Try a different location or file',
        ],
        API_KEY_MISSING: [
            'API key not configured',
            'Add GEMINI_API_KEY to .env.local',
            'Format: GEMINI_API_KEY=your-key-here',
            'Get free key from https://ai.google.dev',
            'Restart the app after adding key',
        ],
        API_CALL_FAILED: [
            'Failed to call AI API',
            'Check your internet connection',
            'Verify API key is valid',
            'Try again in a few moments',
            'Check AI provider status page',
        ],
        UNKNOWN: [
            'Unknown error occurred',
            'Check logs for more details',
            'Try again',
            'If persistent, report as issue',
        ],
    };
    return steps[code] || steps.UNKNOWN;
}
/**
 * Batch execute multiple tasks and wait for all to complete
 */
async function executeBatch(tasks) {
    const results = await Promise.all(tasks.map((task) => executeWithTimeout({
        requestId: task.requestId,
        taskType: task.taskType,
        startTime: Date.now(),
    }, task.execute, task.timeout)));
    return results;
}
/**
 * Retry helper with exponential backoff
 */
async function executeWithRetry(context, execute, timeout, maxRetries = 3, initialBackoffMs = 1000) {
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
            const backoff = initialBackoffMs * Math.pow(2, attempt - 1);
            console.log(`[${context.taskType}] Retry ${attempt}/${maxRetries} in ${backoff}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
        }
        const result = await executeWithTimeout(context, execute, timeout);
        if (result.success) {
            return result;
        }
        lastError = result;
        // Don't retry if not retryable
        if (!result.error?.retryable) {
            console.log(`[${context.taskType}] Error not retryable, stopping`);
            break;
        }
        console.log(`[${context.taskType}] Attempt ${attempt + 1} failed: ${result.error?.message}`);
    }
    return (lastError || {
        success: false,
        error: {
            code: ipc_types_1.IPCErrorCode.UNKNOWN,
            message: 'Failed after retries',
            retryable: false,
        },
        duration: 0,
    });
}
exports.default = {
    executeWithTimeout,
    executeWithRetry,
    executeBatch,
    classifyError,
};
