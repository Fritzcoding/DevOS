/**
 * Task Executor
 * Wraps async operations with timeout, error handling, and logging
 */

import { IPCErrorCode } from '../ipc-types';
import type { IPCError } from '../ipc-types';
import { logger } from './logger';

export interface ExecutionContext {
  requestId: string;
  taskType: string;
  startTime: number;
  signal?: AbortSignal;
}

export interface ExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: IPCError;
  duration: number;
  warnings?: string[];
}

/**
 * Error classification helper
 */
export function classifyError(error: any): IPCErrorCode {
  const message = error.message || error.toString();
  const code = error.code || '';

  // Rate limiting
  if (
    message.includes('RATE_LIMIT') ||
    message.includes('429') ||
    message.includes('quota')
  ) {
    return IPCErrorCode.RATE_LIMITED;
  }

  // Timeout
  if (
    message.includes('timeout') ||
    message.includes('TIMEOUT') ||
    error.name === 'AbortError'
  ) {
    return IPCErrorCode.TIMEOUT;
  }

  // File operations
  if (
    message.includes('ENOENT') ||
    message.includes('not found') ||
    code === 'ENOENT'
  ) {
    return IPCErrorCode.FILE_NOT_FOUND;
  }

  if (
    message.includes('EACCES') ||
    message.includes('EPERM') ||
    message.includes('permission denied') ||
    code === 'EACCES' ||
    code === 'EPERM'
  ) {
    return IPCErrorCode.PERMISSION_DENIED;
  }

  // API authentication
  if (
    message.includes('API_KEY') ||
    message.includes('INVALID_API_KEY') ||
    message.includes('AUTHENTICATION_FAILED')
  ) {
    return IPCErrorCode.API_KEY_MISSING;
  }

  // API errors
  if (
    message.includes('API') ||
    message.includes('HTTP') ||
    message.includes('network')
  ) {
    return IPCErrorCode.API_CALL_FAILED;
  }

  // Parameter validation
  if (
    message.includes('Invalid') ||
    message.includes('required') ||
    message.includes('parameter')
  ) {
    return IPCErrorCode.INVALID_PARAMS;
  }

  // Cancelled
  if (message.includes('cancelled') || message.includes('aborted')) {
    return IPCErrorCode.CANCELLED;
  }

  return IPCErrorCode.UNKNOWN;
}

/**
 * Execute a task with proper error handling and timeout
 *
 * @param context - Execution context (requestId, taskType, etc.)
 * @param execute - Async function to execute
 * @param timeout - Max execution time (ms)
 * @returns Execution result with proper error classification
 */
export async function executeWithTimeout<T>(
  context: ExecutionContext,
  execute: (signal: AbortSignal) => Promise<T>,
  timeout: number,
): Promise<ExecutionResult<T>> {
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
      logger.info('TaskExecutor', `Task completed: ${context.taskType}`, {
        duration,
        requestId: context.requestId,
      });

      return {
        success: true,
        data,
        duration,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorCode = classifyError(error);

    logger.error(
      'TaskExecutor',
      `Task failed: ${context.taskType}`,
      {
        errorCode,
        duration,
        requestId: context.requestId,
        errorMessage: error.message,
      },
      error
    );

    const ipcError: IPCError = {
      code: errorCode as IPCErrorCode,
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
function isRetryable(code: IPCErrorCode): boolean {
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
function getRecoverySteps(code: IPCErrorCode): string[] {
  const steps: Record<IPCErrorCode, string[]> = {
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
export async function executeBatch<T>(
  tasks: Array<{
    requestId: string;
    taskType: string;
    execute: (signal: AbortSignal) => Promise<T>;
    timeout: number;
  }>,
): Promise<ExecutionResult<T>[]> {
  const results = await Promise.all(
    tasks.map((task) =>
      executeWithTimeout(
        {
          requestId: task.requestId,
          taskType: task.taskType,
          startTime: Date.now(),
        },
        task.execute,
        task.timeout,
      ),
    ),
  );

  return results;
}

/**
 * Retry helper with exponential backoff
 */
export async function executeWithRetry<T>(
  context: ExecutionContext,
  execute: (signal: AbortSignal) => Promise<T>,
  timeout: number,
  maxRetries = 3,
  initialBackoffMs = 1000,
): Promise<ExecutionResult<T>> {
  let lastError: ExecutionResult<T> | null = null;

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

  return (
    lastError || {
      success: false,
      error: {
        code: IPCErrorCode.UNKNOWN,
        message: 'Failed after retries',
        retryable: false,
      },
      duration: 0,
    }
  );
}

export default {
  executeWithTimeout,
  executeWithRetry,
  executeBatch,
  classifyError,
};
