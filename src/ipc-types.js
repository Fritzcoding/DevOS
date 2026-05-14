"use strict";
/**
 * Type-safe IPC channel contracts
 * All inter-process communication types are defined here
 * Ensures compile-time safety between main process and renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.IPCErrorCode = void 0;
exports.isFixCodeRequest = isFixCodeRequest;
exports.isFixCodeResponse = isFixCodeResponse;
exports.isChatRequest = isChatRequest;
// =======================
// ERROR TYPES
// =======================
var IPCErrorCode;
(function (IPCErrorCode) {
    IPCErrorCode["TIMEOUT"] = "TIMEOUT";
    IPCErrorCode["CANCELLED"] = "CANCELLED";
    IPCErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
    IPCErrorCode["INVALID_PARAMS"] = "INVALID_PARAMS";
    IPCErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    IPCErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    IPCErrorCode["API_KEY_MISSING"] = "API_KEY_MISSING";
    IPCErrorCode["API_CALL_FAILED"] = "API_CALL_FAILED";
    IPCErrorCode["UNKNOWN"] = "UNKNOWN";
})(IPCErrorCode || (exports.IPCErrorCode = IPCErrorCode = {}));
// =======================
// TYPE GUARDS
// =======================
function isFixCodeRequest(obj) {
    return (obj &&
        typeof obj === 'object' &&
        'requestId' in obj &&
        'code' in obj &&
        'language' in obj &&
        'prompt' in obj);
}
function isFixCodeResponse(obj) {
    return (obj &&
        typeof obj === 'object' &&
        'requestId' in obj &&
        'status' in obj &&
        'timestamp' in obj);
}
function isChatRequest(obj) {
    return (obj &&
        typeof obj === 'object' &&
        'requestId' in obj &&
        'message' in obj);
}
// =======================
// CHANNEL DEFINITIONS
// =======================
/**
 * All IPC channel names used in the application
 * Keep in sync with preload.ts and main.ts
 */
exports.IPC_CHANNELS = {
    // Code Fixer
    FIX_CODE: 'fix-code',
    FIX_CODE_STREAM: 'fix-code-stream',
    // Chat/Discussion
    CHAT: 'chat',
    CHAT_STREAM: 'chat-stream',
    // Environment
    DETECT_ENV: 'detect-env',
    SETUP_ENV: 'setup-env',
    SETUP_ENV_STREAM: 'setup-env-stream',
    // File Operations
    READ_FILE: 'read-file',
    WRITE_FILE: 'write-file',
    ORGANIZE_FILES: 'organize-files',
    APPLY_ORGANIZATION: 'apply-organization',
    // Task Management
    CANCEL_TASK: 'cancel-task',
    GET_TASK_STATUS: 'get-task-status',
    // System
    HEALTH_CHECK: 'health-check',
    GET_API_KEYS_STATUS: 'get-api-keys-status',
};
