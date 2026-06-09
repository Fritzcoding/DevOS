"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Preload script - exposes safe IPC methods to the renderer process
 * Uses context isolation for security
 */
const electronAPI = {
    // Code Fixing
    fixCode: (code, language, mode = 'ai') => electron_1.ipcRenderer.invoke('DevOS:code-fixer:fix', { code, language, mode }),
    runCodeFixAgent: (request) => electron_1.ipcRenderer.invoke('DevOS:code-fixer:agent', request),
    readClipboard: () => electron_1.ipcRenderer.invoke('DevOS:clipboard:read'),
    writeClipboard: (content) => electron_1.ipcRenderer.invoke('DevOS:clipboard:write', { content }),
    getTestSamples: () => electron_1.ipcRenderer.invoke('DevOS:samples:list'),
    resetTestSamples: () => electron_1.ipcRenderer.invoke('DevOS:samples:reset'),
    chatAI: (message, context) => electron_1.ipcRenderer.invoke('DevOS:chat:send', { message, context }),
    onCodeFixStream: (callback) => {
        const wrappedCallback = (_event, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('DevOS:code-fixer:stream', wrappedCallback);
        return () => electron_1.ipcRenderer.off('DevOS:code-fixer:stream', wrappedCallback);
    },
    // Environment Management
    detectEnv: (projectPath) => electron_1.ipcRenderer.invoke('DevOS:env:detect', { projectPath }),
    setupEnv: (projectPath, envType) => electron_1.ipcRenderer.invoke('DevOS:env:setup', { projectPath, envType }),
    onSetupEnvStream: (callback) => {
        const wrappedCallback = (_event, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('DevOS:env:stream', wrappedCallback);
        return () => electron_1.ipcRenderer.off('DevOS:env:stream', wrappedCallback);
    },
    // File Operations
    readFile: (filePath) => electron_1.ipcRenderer.invoke('DevOS:file:read', { filePath }),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('DevOS:file:write', { filePath, content }),
    organizeFolder: (folderPath, rules, mode = 'professional', instruction) => electron_1.ipcRenderer.invoke('DevOS:file:organize', { folderPath, rules, mode, instruction }),
    applyOrganization: (folderPath, organization) => electron_1.ipcRenderer.invoke('DevOS:file:apply-org', { folderPath, organization }),
    chatWithCodebase: (projectPath, message, history) => electron_1.ipcRenderer.invoke('DevOS:chat:codebase', { projectPath, message, history }),
    // Task Management
    cancelTask: (requestId) => electron_1.ipcRenderer.invoke('DevOS:task:cancel', { requestId }),
    healthCheck: () => electron_1.ipcRenderer.invoke('DevOS:health-check'),
    // Streaming Events
    onChatStream: (callback) => {
        const wrappedCallback = (_event, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('DevOS:chat:stream', wrappedCallback);
        return () => electron_1.ipcRenderer.off('DevOS:chat:stream', wrappedCallback);
    },
    // Window Management
    minimizeToTray: () => electron_1.ipcRenderer.invoke('DevOS:window:minimize-tray'),
    showMainWindow: () => electron_1.ipcRenderer.invoke('DevOS:window:show'),
    moveWindow: (x, y) => electron_1.ipcRenderer.invoke('DevOS:window:move', x, y),
    resizeWindow: (width, height) => electron_1.ipcRenderer.invoke('DevOS:window:resize', width, height),
    setIgnoreMouseEvents: (ignore) => electron_1.ipcRenderer.invoke('DevOS:window:set-ignore-mouse-events', ignore),
    deactivateApp: () => electron_1.ipcRenderer.invoke('DevOS:app:deactivate'),
    getAISettings: () => electron_1.ipcRenderer.invoke('DevOS:ai:get-settings'),
    saveAISettings: (settings) => electron_1.ipcRenderer.invoke('DevOS:ai:save-settings', settings),
    completeAISetup: () => electron_1.ipcRenderer.invoke('DevOS:ai:complete-setup'),
    getAIStatus: () => electron_1.ipcRenderer.invoke('DevOS:ai:get-status'),
    setActiveAIBackend: (backend) => electron_1.ipcRenderer.invoke('DevOS:ai:set-active-backend', backend),
    executeAIPrompt: (request) => electron_1.ipcRenderer.invoke('DevOS:ai:execute-prompt', request),
    pullOllamaModel: () => electron_1.ipcRenderer.invoke('DevOS:ai:pull-ollama-model'),
    cancelOllamaPull: () => electron_1.ipcRenderer.invoke('DevOS:ai:cancel-ollama-pull'),
    onOllamaPullProgress: (callback) => {
        const wrappedCallback = (_event, progress) => callback(progress);
        electron_1.ipcRenderer.on('DevOS:ai:ollama-pull-progress', wrappedCallback);
        return () => electron_1.ipcRenderer.off('DevOS:ai:ollama-pull-progress', wrappedCallback);
    },
    onShowMenu: (callback) => {
        const wrappedCallback = () => callback();
        electron_1.ipcRenderer.on('DevOS:show-menu', wrappedCallback);
        return () => electron_1.ipcRenderer.off('DevOS:show-menu', wrappedCallback);
    },
    selectProjectPath: () => electron_1.ipcRenderer.invoke('DevOS:dialog:select-path'),
    getCurrentProjectPath: () => electron_1.ipcRenderer.invoke('DevOS:project:get-current-path'),
    createDiscussionRoom: (projectPath, syncUrl) => electron_1.ipcRenderer.invoke('DevOS:discussion:create', { projectPath, syncUrl }),
    joinDiscussionRoom: (projectPath, key, syncUrl) => electron_1.ipcRenderer.invoke('DevOS:discussion:join', { projectPath, key, syncUrl }),
    readDiscussionRoom: (projectPath, key, syncUrl) => electron_1.ipcRenderer.invoke('DevOS:discussion:read', { projectPath, key, syncUrl }),
    writeDiscussionRoom: (projectPath, key, content, syncUrl) => electron_1.ipcRenderer.invoke('DevOS:discussion:write', { projectPath, key, content, syncUrl }),
    getDiscussionSyncInfo: () => electron_1.ipcRenderer.invoke('DevOS:discussion:sync-info'),
    // Legacy compatibility
    organizeFolder_legacy: (path, rules) => electron_1.ipcRenderer.invoke('DevOS:file:organize', { folderPath: path, rules }),
    applyOrganization_legacy: (path, org) => electron_1.ipcRenderer.invoke('DevOS:file:apply-org', { folderPath: path, organization: org }),
    detectEnv_legacy: (projectPath) => electron_1.ipcRenderer.invoke('DevOS:env:detect', { projectPath }),
    setupEnv_legacy: (projectPath, envType) => electron_1.ipcRenderer.invoke('DevOS:env:setup', { projectPath, envType }),
    readFile_legacy: (filePath) => electron_1.ipcRenderer.invoke('DevOS:file:read', { filePath }),
    fixCode_legacy: (code, language, prompt) => electron_1.ipcRenderer.invoke('DevOS:code-fixer:fix', { code, language, prompt }),
    chatAI_legacy: (message, context) => electron_1.ipcRenderer.invoke('DevOS:chat:send', { message, context }),
};
// Expose safe API to renderer context
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
