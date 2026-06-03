/**
 * Window API type definitions
 * Exposes Electron API to React components
 */

import type {
  FixCodeRequest,
  FixCodeResponse,
  ChatRequest,
  ChatResponse,
  DetectEnvRequest,
  DetectEnvResponse,
  SetupEnvRequest,
  SetupEnvResponse,
  ReadFileRequest,
  ReadFileResponse,
  OrganizeFileRequest,
  OrganizeFileResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  HealthCheckResponse,
  CodeFixStreamChunk,
  SetupEnvStreamChunk,
} from './ipc-types';

export interface ElectronAPI {
  // Code Fixing
  fixCode(code: string, language: string, mode?: 'manual' | 'ai'): Promise<FixCodeResponse>;
  runCodeFixAgent(request: {
    projectPath?: string;
    scope: 'clipboard' | 'file' | 'codebase';
    mode?: 'ai';
    instruction: string;
    filePath?: string;
    code?: string;
    apply?: boolean;
  }): Promise<any>;
  readClipboard(): Promise<{ success: boolean; content?: string; error?: string }>;
  chatAI(message: string, context?: string): Promise<ChatResponse>;
  onCodeFixStream(callback: (chunk: CodeFixStreamChunk) => void): () => void;

  // Environment Management
  detectEnv(projectPath: string): Promise<DetectEnvResponse>;
  setupEnv(projectPath: string, envType: string): Promise<SetupEnvResponse>;
  onSetupEnvStream(callback: (chunk: SetupEnvStreamChunk) => void): () => void;

  // File Operations
  readFile(filePath: string): Promise<ReadFileResponse>;
  organizeFolder(folderPath: string, rules?: any, mode?: 'professional' | 'ai', instruction?: string): Promise<OrganizeFileResponse>;
  applyOrganization(folderPath: string, organization: any): Promise<OrganizeFileResponse>;
  chatWithCodebase(projectPath: string, message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<any>;

  // Task Management
  cancelTask(requestId: string): Promise<CancelTaskResponse>;
  healthCheck(): Promise<HealthCheckResponse>;

  // Streaming Events
  onChatStream(callback: (chunk: any) => void): () => void;

  // Window Management
  minimizeToTray(): Promise<void>;
  showMainWindow(): Promise<void>;
  moveWindow(x: number, y: number): Promise<void>;
  resizeWindow(width: number, height: number): Promise<void>;
  setIgnoreMouseEvents(ignore: boolean): Promise<void>;
  getAISettings(): Promise<any>;
  saveAISettings(settings: any): Promise<any>;
  completeAISetup(): Promise<any>;
  getAIStatus(): Promise<any>;
  setActiveAIBackend(backend: 'local' | 'cloud'): Promise<any>;
  executeAIPrompt(request: { prompt: string; systemPrompt?: string; maxTokens?: number; temperature?: number }): Promise<any>;
  pullOllamaModel(): Promise<any>;
  cancelOllamaPull(): Promise<any>;
  onOllamaPullProgress(callback: (progress: any) => void): () => void;
  onShowMenu(callback: () => void): () => void;

  // Project Path Selection
  selectProjectPath(): Promise<{ success: boolean; path: string | null; error?: string; canceled?: boolean }>;
  getCurrentProjectPath(): Promise<{ success: boolean; path: string | null; error?: string }>;
  createDiscussionRoom(projectPath: string): Promise<{ success: boolean; key?: string; content?: string; path?: string; error?: string }>;
  joinDiscussionRoom(projectPath: string, key: string): Promise<{ success: boolean; key?: string; content?: string; path?: string; error?: string }>;
  readDiscussionRoom(projectPath: string, key: string): Promise<{ success: boolean; key?: string; content?: string; updatedAt?: number; error?: string }>;
  writeDiscussionRoom(projectPath: string, key: string, content: string): Promise<{ success: boolean; key?: string; updatedAt?: number; error?: string }>;

  // Legacy (backward compatibility)
  organizeFolder_legacy(path: string, rules: any): Promise<any>;
  applyOrganization_legacy(path: string, org: any): Promise<any>;
  detectEnv_legacy(projectPath: string): Promise<any>;
  setupEnv_legacy(projectPath: string, envType: string): Promise<any>;
  readFile_legacy(filePath: string): Promise<any>;
  fixCode_legacy(code: string, language: string, prompt: string): Promise<any>;
  chatAI_legacy(message: string, context: string): Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron?: any; // Legacy
  }
}

export {};
