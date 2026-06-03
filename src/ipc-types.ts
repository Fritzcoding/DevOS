/**
 * Type-safe IPC channel contracts
 * All inter-process communication types are defined here
 * Ensures compile-time safety between main process and renderer process
 */

// =======================
// REQUEST/RESPONSE TYPES
// =======================

export interface IPCRequestBase {
  requestId: string;
  timestamp: number;
  timeout?: number; // milliseconds
}

export interface IPCResponseBase {
  requestId: string;
  status: 'success' | 'error' | 'partial' | 'cancelled';
  timestamp: number;
  duration: number; // milliseconds
  error?: string;
}

// =======================
// CODE FIXER
// =======================

export interface FixCodeRequest extends IPCRequestBase {
  code: string;
  language: string;
  prompt: string;
  mode?: 'manual' | 'ai';
  modelPreference?: 'gemini' | 'openai' | 'ollama';
}

export interface FixCodeResponse extends IPCResponseBase {
  fixed?: string;
  explanation?: string;
  errorType?: 'API_KEY_NOT_SET' | 'API_KEY_INVALID' | 'RATE_LIMITED' | 'TOKEN_LIMIT' | 'MODEL_NOT_FOUND' | 'NETWORK' | 'UNKNOWN';
  mode?: 'manual' | 'ai';
  modelUsed?: 'gemini' | 'openai' | 'ollama'; // which model actually fixed it
  tokensUsed?: number;
  warnings?: string[];
  suggestFallback?: boolean; // if true, suggest fallback model
}

export interface CodeFixChange {
  path?: string;
  original: string;
  fixed: string;
  explanation: string;
  confidence: number;
}

export interface CodeFixAgentResponse extends IPCResponseBase {
  mode?: 'manual' | 'ai';
  scope?: 'clipboard' | 'file' | 'codebase';
  summary?: string;
  confidence?: number;
  changes?: CodeFixChange[];
  filesScanned?: number;
  filesChanged?: number;
  applied?: boolean;
  errorType?: 'API_KEY_NOT_SET' | 'API_KEY_INVALID' | 'RATE_LIMITED' | 'TOKEN_LIMIT' | 'MODEL_NOT_FOUND' | 'NETWORK' | 'UNKNOWN';
}

export interface CodeFixStreamChunk {
  requestId: string;
  partial: string;
  done: boolean;
  tokenCount?: number;
}

// =======================
// AI CHAT/DISCUSSION
// =======================

export interface ChatRequest extends IPCRequestBase {
  message: string;
  context?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse extends IPCResponseBase {
  response?: string;
  modelUsed?: string;
  tokensUsed?: number;
}

// =======================
// ENVIRONMENT DETECTION
// =======================
export interface SetupStep {
  step: number;
  description: string;
  command: string;
  platform: 'mac' | 'windows' | 'linux' | 'universal';
  required: boolean;
}
export interface DetectEnvRequest extends IPCRequestBase {
  projectPath: string;
  autoDetectPath?: boolean;
}

export interface DetectEnvResponse extends IPCResponseBase {
  nodejs?: boolean;
  python?: boolean;
  java?: boolean;
  frameworks?: string[];
  packageManagers?: string[];
  nodeVersion?: string;
  pythonVersion?: string;
  javaVersion?: string;
  detectionConfidence?: number; // 0-100
  // Extended fields for environment setup
  detected_type?: string;
  missing_tools?: string[];
  setup_steps?: SetupStep[];
  env_vars_needed?: string[];
  estimated_minutes?: number;
}

// =======================
// ENVIRONMENT SETUP
// =======================

export interface SetupEnvRequest extends IPCRequestBase {
  projectPath: string;
  envType: 'nodejs' | 'python' | 'java' | 'auto';
  verbose?: boolean;
}

export interface SetupEnvResponse extends IPCResponseBase {
  success?: boolean;
  stdout?: string;
  stderr?: string;
  commandsExecuted?: string[];
}

export interface SetupEnvStreamChunk {
  requestId: string;
  type: 'stdout' | 'stderr' | 'progress';
  data: string;
  done?: boolean;
}

// =======================
// FILE ORGANIZATION
// =======================

export interface OrganizeFileRequest extends IPCRequestBase {
  folderPath: string;
  mode?: 'professional' | 'ai' | 'by-type' | 'by-feature' | 'by-language' | 'custom';
  instruction?: string;
  customRules?: CustomOrganizationRule[];
  previewOnly?: boolean;
}

export interface CustomOrganizationRule {
  pattern: string; // regex
  category: string;
  priority?: number;
}

export interface FileOrganizationPreview {
  fromPath: string;
  toPath: string;
  category: string;
  reason?: string;
}

export interface OrganizeFileResponse extends IPCResponseBase {
  preview?: FileOrganizationPreview[];
  appliedChanges?: FileOrganizationPreview[];
  filesProcessed?: number;
  directoriesProcessed?: number;
  operationsProcessed?: number;
  categoriesCreated?: string[];
  rollbackBatchId?: string;
  rollbackLogPath?: string;
  errors?: string[];
  // Extended fields for file organization plan
  redundant_files?: Array<{ path: string; reason: string; action: 'DELETE' | 'ARCHIVE' }>;
  moves?: Array<{ from: string; to: string; reason: string }>;
  new_dirs_to_create?: string[];
  summary?: string;
  risk_level?: 'low' | 'medium' | 'high';
}

export interface ApplyOrganizationRequest extends IPCRequestBase {
  folderPath: string;
  organization: OrganizedCategory[];
}

export interface OrganizedCategory {
  name: string;
  files: OrganizedFile[];
}

export interface OrganizedFile {
  originalName: string;
  originalPath: string;
  newPath: string;
}

// =======================
// FILE OPERATIONS
// =======================

export interface ReadFileRequest extends IPCRequestBase {
  filePath: string;
}

export interface ReadFileResponse extends IPCResponseBase {
  content?: string;
  encoding?: string;
  sizeKB?: number;
}

export interface WriteFileRequest extends IPCRequestBase {
  filePath: string;
  content: string;
  createDirectories?: boolean;
}

export interface WriteFileResponse extends IPCResponseBase {
  bytesWritten?: number;
}

// =======================
// SYSTEM/HEALTH
// =======================

export interface HealthCheckResponse extends IPCResponseBase {
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  processes: {
    active: number;
    queued: number;
    failed: number;
  };
}

// =======================
// TASK MANAGEMENT
// =======================

export interface CancelTaskRequest extends IPCRequestBase {
  targetRequestId: string;
}

export interface CancelTaskResponse extends IPCResponseBase {
  cancelled?: boolean;
  reason?: string;
}

export interface TaskStatus {
  requestId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number; // 0-100
  estimatedSecondsRemaining?: number;
  canCancel?: boolean;
}

// =======================
// STREAMING/EVENTS
// =======================

export interface StreamStartEvent {
  requestId: string;
  type: string;
  estimatedDuration?: number;
}

export interface StreamProgressEvent {
  requestId: string;
  progress: number; // 0-100
  statusMessage?: string;
}

export interface StreamErrorEvent {
  requestId: string;
  error: string;
  code?: string;
  recoverable?: boolean;
}

export interface StreamCompleteEvent {
  requestId: string;
  success: boolean;
  summary?: string;
}

// =======================
// API KEY MANAGEMENT
// =======================

export interface ApiKeyConfig {
  provider: 'gemini' | 'openai' | 'ollama';
  key: string;
  configured: boolean;
  lastTested?: number; // timestamp
  testStatus?: 'ok' | 'failed' | 'unknown';
}

export interface ApiKeysResponse extends IPCResponseBase {
  keys: {
    gemini?: Omit<ApiKeyConfig, 'key'>; // never return actual key
    openai?: Omit<ApiKeyConfig, 'key'>;
    ollama?: Omit<ApiKeyConfig, 'key'>;
  };
}

// =======================
// ERROR TYPES
// =======================

export enum IPCErrorCode {
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_CALL_FAILED = 'API_CALL_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface IPCError {
  code: IPCErrorCode;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  recoverySteps?: string[];
}

// =======================
// TYPE GUARDS
// =======================

export function isFixCodeRequest(obj: any): obj is FixCodeRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    'requestId' in obj &&
    'code' in obj &&
    'language' in obj &&
    'prompt' in obj
  );
}

export function isFixCodeResponse(obj: any): obj is FixCodeResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'requestId' in obj &&
    'status' in obj &&
    'timestamp' in obj
  );
}

export function isChatRequest(obj: any): obj is ChatRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    'requestId' in obj &&
    'message' in obj
  );
}

// =======================
// CHANNEL DEFINITIONS
// =======================

/**
 * All IPC channel names used in the application
 * Keep in sync with preload.ts and main.ts
 */
export const IPC_CHANNELS = {
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
} as const;
