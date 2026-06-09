import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './src/window';

/**
 * Preload script - exposes safe IPC methods to the renderer process
 * Uses context isolation for security
 */

const electronAPI: ElectronAPI = {
  // Code Fixing
  fixCode: (code: string, language: string, mode: 'manual' | 'ai' = 'ai') =>
    ipcRenderer.invoke('DevOS:code-fixer:fix', { code, language, mode }),

  runCodeFixAgent: (request) =>
    ipcRenderer.invoke('DevOS:code-fixer:agent', request),

  readClipboard: () =>
    ipcRenderer.invoke('DevOS:clipboard:read'),

  writeClipboard: (content: string) =>
    ipcRenderer.invoke('DevOS:clipboard:write', { content }),

  getTestSamples: () =>
    ipcRenderer.invoke('DevOS:samples:list'),

  resetTestSamples: () =>
    ipcRenderer.invoke('DevOS:samples:reset'),
  
  chatAI: (message: string, context?: string) =>
    ipcRenderer.invoke('DevOS:chat:send', { message, context }),
  
  onCodeFixStream: (callback) => {
    const wrappedCallback = (_event: any, chunk: any) => callback(chunk);
    ipcRenderer.on('DevOS:code-fixer:stream', wrappedCallback);
    return () => ipcRenderer.off('DevOS:code-fixer:stream', wrappedCallback);
  },

  // Environment Management
  detectEnv: (projectPath: string) =>
    ipcRenderer.invoke('DevOS:env:detect', { projectPath }),
  
  setupEnv: (projectPath: string, envType: string) =>
    ipcRenderer.invoke('DevOS:env:setup', { projectPath, envType }),
  
  onSetupEnvStream: (callback) => {
    const wrappedCallback = (_event: any, chunk: any) => callback(chunk);
    ipcRenderer.on('DevOS:env:stream', wrappedCallback);
    return () => ipcRenderer.off('DevOS:env:stream', wrappedCallback);
  },

  // File Operations
  readFile: (filePath: string) =>
    ipcRenderer.invoke('DevOS:file:read', { filePath }),

  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('DevOS:file:write', { filePath, content }),
  
  organizeFolder: (folderPath: string, rules?: any, mode: 'professional' | 'ai' = 'professional', instruction?: string) =>
    ipcRenderer.invoke('DevOS:file:organize', { folderPath, rules, mode, instruction }),
  
  applyOrganization: (folderPath: string, organization: any) =>
    ipcRenderer.invoke('DevOS:file:apply-org', { folderPath, organization }),

  chatWithCodebase: (projectPath: string, message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) =>
    ipcRenderer.invoke('DevOS:chat:codebase', { projectPath, message, history }),

  // Task Management
  cancelTask: (requestId: string) =>
    ipcRenderer.invoke('DevOS:task:cancel', { requestId }),
  
  healthCheck: () =>
    ipcRenderer.invoke('DevOS:health-check'),

  // Streaming Events
  onChatStream: (callback) => {
    const wrappedCallback = (_event: any, chunk: any) => callback(chunk);
    ipcRenderer.on('DevOS:chat:stream', wrappedCallback);
    return () => ipcRenderer.off('DevOS:chat:stream', wrappedCallback);
  },

  // Window Management
  minimizeToTray: () =>
    ipcRenderer.invoke('DevOS:window:minimize-tray'),
  
  showMainWindow: () =>
    ipcRenderer.invoke('DevOS:window:show'),
  
  moveWindow: (x: number, y: number) =>
    ipcRenderer.invoke('DevOS:window:move', x, y),

  resizeWindow: (width: number, height: number) =>
    ipcRenderer.invoke('DevOS:window:resize', width, height),

  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.invoke('DevOS:window:set-ignore-mouse-events', ignore),

  deactivateApp: () =>
    ipcRenderer.invoke('DevOS:app:deactivate'),

  getAISettings: () =>
    ipcRenderer.invoke('DevOS:ai:get-settings'),

  saveAISettings: (settings) =>
    ipcRenderer.invoke('DevOS:ai:save-settings', settings),

  completeAISetup: () =>
    ipcRenderer.invoke('DevOS:ai:complete-setup'),

  getAIStatus: () =>
    ipcRenderer.invoke('DevOS:ai:get-status'),

  setActiveAIBackend: (backend) =>
    ipcRenderer.invoke('DevOS:ai:set-active-backend', backend),

  executeAIPrompt: (request) =>
    ipcRenderer.invoke('DevOS:ai:execute-prompt', request),

  pullOllamaModel: () =>
    ipcRenderer.invoke('DevOS:ai:pull-ollama-model'),

  cancelOllamaPull: () =>
    ipcRenderer.invoke('DevOS:ai:cancel-ollama-pull'),

  onOllamaPullProgress: (callback) => {
    const wrappedCallback = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('DevOS:ai:ollama-pull-progress', wrappedCallback);
    return () => ipcRenderer.off('DevOS:ai:ollama-pull-progress', wrappedCallback);
  },
  
  onShowMenu: (callback) => {
    const wrappedCallback = () => callback();
    ipcRenderer.on('DevOS:show-menu', wrappedCallback);
    return () => ipcRenderer.off('DevOS:show-menu', wrappedCallback);
  },
  selectProjectPath: () =>
    ipcRenderer.invoke('DevOS:dialog:select-path'),

  getCurrentProjectPath: () =>
    ipcRenderer.invoke('DevOS:project:get-current-path'),

  createDiscussionRoom: (projectPath: string, syncUrl?: string) =>
    ipcRenderer.invoke('DevOS:discussion:create', { projectPath, syncUrl }),

  joinDiscussionRoom: (projectPath: string, key: string, syncUrl?: string) =>
    ipcRenderer.invoke('DevOS:discussion:join', { projectPath, key, syncUrl }),

  readDiscussionRoom: (projectPath: string, key: string, syncUrl?: string) =>
    ipcRenderer.invoke('DevOS:discussion:read', { projectPath, key, syncUrl }),

  writeDiscussionRoom: (projectPath: string, key: string, content: string, syncUrl?: string) =>
    ipcRenderer.invoke('DevOS:discussion:write', { projectPath, key, content, syncUrl }),

  getDiscussionSyncInfo: () =>
    ipcRenderer.invoke('DevOS:discussion:sync-info'),

  // Legacy compatibility
  organizeFolder_legacy: (path: string, rules: any) =>
    ipcRenderer.invoke('DevOS:file:organize', { folderPath: path, rules }),
  
  applyOrganization_legacy: (path: string, org: any) =>
    ipcRenderer.invoke('DevOS:file:apply-org', { folderPath: path, organization: org }),
  
  detectEnv_legacy: (projectPath: string) =>
    ipcRenderer.invoke('DevOS:env:detect', { projectPath }),
  
  setupEnv_legacy: (projectPath: string, envType: string) =>
    ipcRenderer.invoke('DevOS:env:setup', { projectPath, envType }),
  
  readFile_legacy: (filePath: string) =>
    ipcRenderer.invoke('DevOS:file:read', { filePath }),
  
  fixCode_legacy: (code: string, language: string, prompt: string) =>
    ipcRenderer.invoke('DevOS:code-fixer:fix', { code, language, prompt }),
  
  chatAI_legacy: (message: string, context: string) =>
    ipcRenderer.invoke('DevOS:chat:send', { message, context }),
};

// Expose safe API to renderer context
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
