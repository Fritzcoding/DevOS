// Load environment variables from .env.local BEFORE checking NODE_ENV
import dotenv from 'dotenv';
const envLocalPath = require('path').resolve(process.cwd(), '.env.local');
const envPath = require('path').resolve(process.cwd(), '.env');
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envLocalPath, encoding: 'utf16le' });
dotenv.config({ path: envPath });
dotenv.config({ path: envPath, encoding: 'utf16le' });

import {
  app,
  BrowserWindow,
  Menu,
  screen,
  Tray,
  ipcMain,
  IpcMainInvokeEvent,
} from 'electron';
import path from 'path';
import * as fsExtra from 'fs-extra';
import { exec } from 'child_process';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { IPCErrorCode, IPC_CHANNELS } from './src/ipc-types';
import { aiClient } from './src/services/ai/ai-client';
import { aiSettingsManager, type AIBackend } from './src/services/ai-routing/AISettingsManager';
import { aiRouter } from './src/services/ai-routing/AIRouter';
import { ollamaClient } from './src/services/ai-routing/OllamaClient';
import { generateOrganizerPlan } from './src/features/file-organizer/ai-codebase-organizer';
import { legacyPlanToOperations } from './src/features/file-organizer/engine/plan-adapter';
import { SafeFileOperationExecutor } from './src/features/file-organizer/engine/safe-file-operation-executor';
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
  CancelTaskRequest,
  CancelTaskResponse,
  HealthCheckResponse,
  OrganizeFileRequest,
  OrganizeFileResponse,
} from './src/ipc-types';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const execAsync = promisify(exec);
const SHIMEJI_MASCOT_WINDOW_WIDTH = 96;
const SHIMEJI_MASCOT_WINDOW_HEIGHT = 96;
const SHIMEJI_MIN_WINDOW_WIDTH = 80;
const SHIMEJI_MIN_WINDOW_HEIGHT = 80;

// Allow forcing the Shimeji (frameless, transparent) window even when running
// in development. Pass `--shimeji` to Electron or set env `SHIMEJI=1`.
const forceShimeji = process.argv.includes('--shimeji') || process.env.SHIMEJI === '1' || process.env.SHIMEJI_FORCE === 'true';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Helper to check if a dev server is running on a given port
const checkServerReady = async (port: number, timeout: number = 500): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`http://localhost:${port}/`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const html = await response.text();
    return (
      html.includes('src="/src/main.tsx"') ||
      html.includes('My Google AI Studio App') ||
      html.includes('id="root"')
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

// Find available dev server port by probing
const findDevServerPort = async (startPort: number = 5173, maxPort: number = 5185, maxAttempts: number = 60): Promise<number | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (let port = startPort; port <= maxPort; port++) {
      const ready = await checkServerReady(port, 500);
      if (ready) {
        console.log(`[Window] Dev server found on port ${port}`);
        return port;
      }
    }
    // If not found, wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
};

// ============================================================================
// ERROR HELPERS
// ============================================================================

function getRecoverySteps(code: IPCErrorCode): string[] {
  const steps: Record<IPCErrorCode, string[]> = {
    [IPCErrorCode.TIMEOUT]: ['Task took too long', 'Try with simpler input', 'Check connection'],
    [IPCErrorCode.CANCELLED]: ['Task cancelled', 'Try again'],
    [IPCErrorCode.RATE_LIMITED]: ['Wait 60s', 'Try different model', 'Shorter input'],
    [IPCErrorCode.INVALID_PARAMS]: ['Check parameters', 'Verify types'],
    [IPCErrorCode.FILE_NOT_FOUND]: ['Check file path', 'Verify permissions'],
    [IPCErrorCode.PERMISSION_DENIED]: ['Run as admin', 'Check permissions'],
    [IPCErrorCode.API_KEY_MISSING]: ['Add key to .env.local', 'Get free key at ai.google.dev'],
    [IPCErrorCode.API_CALL_FAILED]: ['Check internet', 'Verify API key', 'Try again'],
    [IPCErrorCode.UNKNOWN]: ['Check logs', 'Try again'],
  };
  return steps[code] || [];
}

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

function createWindow(): void {
  // Guard: Don't create if window already exists
  if (mainWindow !== null) {
    console.log('[WINDOW] ⚠ Window already exists, focusing instead');
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  // Development vs. Production (Shimeji) window configuration
  const devMode = isDev && !forceShimeji;
  
  if (devMode) {
    console.log('[WINDOW] Creating development window (normal, movable)...');
  } else {
    console.log('[WINDOW] Creating borderless floating Shimeji window...');
  }
  
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    // Window dimensions
    width: devMode ? 1000 : SHIMEJI_MASCOT_WINDOW_WIDTH,
    height: devMode ? 700 : SHIMEJI_MASCOT_WINDOW_HEIGHT,
    x: devMode ? 100 : 20,
    y: devMode ? 100 : 20,
    minWidth: devMode ? 600 : SHIMEJI_MIN_WINDOW_WIDTH,
    minHeight: devMode ? 400 : SHIMEJI_MIN_WINDOW_HEIGHT,
    resizable: true,
    
    // Frame setup - normal window for dev, frameless for production
    frame: devMode ? true : false,
    transparent: devMode ? false : true,
    backgroundColor: devMode ? '#ffffff' : '#00000000',
    
    // Window icon
    icon: fsExtra.existsSync(iconPath) ? iconPath : undefined,
    
    // Window behavior
    alwaysOnTop: devMode ? false : true,
    skipTaskbar: devMode ? false : true,
    focusable: true,
    hasShadow: devMode ? true : true,
    show: false,
    
    // Security & performance
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  if (!devMode && mainWindow) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  // VERIFICATION LOGGING
  const size = mainWindow.getSize();
  const pos = mainWindow.getPosition();
  if (devMode) {
    console.log('[WINDOW] ✓ Created: ' + size[0] + 'x' + size[1] + ' (dev mode, resizable)');
    console.log('[WINDOW] ✓ Framed: true (title bar visible)');
    console.log('[WINDOW] ✓ AlwaysOnTop: false');
  } else {
    console.log('[WINDOW] ✓ Created: ' + SHIMEJI_MASCOT_WINDOW_WIDTH + 'x' + SHIMEJI_MASCOT_WINDOW_HEIGHT + ' (Shimeji mascot canvas) at (20,20)');
    console.log('[WINDOW] ✓ Frameless: true');
    console.log('[WINDOW] ✓ AlwaysOnTop:' + mainWindow.isAlwaysOnTop());
  }
  console.log('[WINDOW] Actual bounds: ' + size[0] + 'x' + size[1] + ' at (' + pos[0] + ',' + pos[1] + ')');

  // Verify window settings
  mainWindow.once('ready-to-show', () => {
    console.log('[WINDOW] Ready to show');
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      console.log('[WINDOW] Final bounds: ' + JSON.stringify(bounds));
    }
  });

  // Load URL
  const loadDevServerUrl = async () => {
    if (!mainWindow) return;

    const port = await findDevServerPort();
    if (port) {
      const url = `http://localhost:${port}`;
      console.log('[LOAD] Loading from dev server: ' + url);
      await mainWindow!.loadURL(url).catch(err => {
        console.error('[LOAD] Failed to load URL: ' + err.message);
        return mainWindow?.loadURL('http://localhost:5177').catch(() => {
          console.error('[LOAD] Failed to load any dev server URL');
        });
      });
    } else {
      console.error('[LOAD] No dev server port found');
      await mainWindow?.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
        console.error('[LOAD] Failed to load file: ' + err);
      });
    }
  };

  // Always use dev server in dev mode, even for Shimeji
  if (isDev) {
    loadDevServerUrl().then(() => {
      if (mainWindow) {
        mainWindow.show();
      }
    }).catch(err => console.error('[LOAD] Error loading dev server: ' + err));
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
      console.error('[LOAD] Failed to load production file: ' + err);
    });
    mainWindow.show();
  }

  // Show window when ready (for early initialization feedback)
  if (!isDev) {
    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        console.log('[WINDOW] Ready to show (production)');
        mainWindow.show();
      }
    });
  }

  // Development tools
  if (isDev) {
    mainWindow.webContents.openDevTools({
      mode: 'detach',
    });
  }

  // Verify window properties after content loads
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[LOADED] Content loaded');
    if (mainWindow) {
      mainWindow.webContents.send('window-debug-info', {
        bounds: mainWindow.getBounds(),
        alwaysOnTop: mainWindow.isAlwaysOnTop(),
      });
    }
  });

  // Event handlers
  mainWindow.on('closed', () => {
    console.log('[CLOSED] Window closed');
    mainWindow = null;
  });

  mainWindow.on('minimize' as any, (event: any) => {
    console.log('[MINIMIZE] Hiding to tray instead');
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('close', (event: any) => {
    if (!(app as any).isQuitting) {
      console.log('[CLOSE] Hiding instead of closing');
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

// ============================================================================
// TRAY MANAGEMENT
// ============================================================================

function createTray(): void {
  if (!mainWindow) return;

  try {
    const fs = require('fs');

    // Prefer tray-icon.png, then icon.png, then fallback
    const candidates = [
      path.join(__dirname, 'assets', 'tray-icon.png'),
      path.join(process.cwd(), 'assets', 'tray-icon.png'),
      path.join(__dirname, 'assets', 'icon.png'),
      path.join(process.cwd(), 'assets', 'icon.png'),
    ];

    let iconPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        iconPath = p;
        break;
      }
    }

    if (!iconPath) {
      console.warn('[TRAY] No tray icon found in expected paths, falling back to Electron executable.');
      iconPath = process.execPath;
    }

    tray = new Tray(iconPath as string);
  } catch (err) {
    console.error('[TRAY] Failed to create tray icon:', err);
    try {
      tray = new Tray(process.execPath);
    } catch (err2) {
      console.error('[TRAY] Final tray fallback failed:', err2);
      tray = null;
      return;
    }
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ============================================================================
// APP EVENT HANDLERS
// ============================================================================

app.on('ready', () => {
  console.log('[APP] Ready');
  createWindow();
  if (process.platform !== 'linux') {
    createTray();
  }
});

app.on('window-all-closed', () => {
  console.log('[APP] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[APP] Activated');
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// ============================================================================
// IPC HANDLERS
// ============================================================================

ipcMain.handle(IPC_CHANNELS.HEALTH_CHECK, async (event: IpcMainInvokeEvent, request: any): Promise<HealthCheckResponse> => {
  const uptime = process.uptime();
  const memInfo = process.memoryUsage();
  return {
    status: 'success',
    requestId: request?.requestId || 'unknown',
    timestamp: Date.now(),
    duration: 0,
    uptime: uptime,
    memory: {
      heapUsed: memInfo.heapUsed,
      heapTotal: memInfo.heapTotal,
      external: memInfo.external,
    },
    processes: {
      active: 0,
      queued: 0,
      failed: 0,
    },
  };
});

// Add other IPC handlers as needed...

// ============================================================================
// WINDOW MESSAGING
// ============================================================================

ipcMain.handle('devops:window:minimize-tray', async () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  return { success: true };
});

ipcMain.handle('devops:window:show', async () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
  return { success: true };
});

ipcMain.handle('devops:window:move', async (event: IpcMainInvokeEvent, x: number, y: number) => {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching({ x, y, width: bounds.width, height: bounds.height });
    const { workArea } = display;
    const clampedX = Math.round(Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - bounds.width)));
    const clampedY = Math.round(Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - bounds.height)));
    mainWindow.setBounds({ x: clampedX, y: clampedY, width: bounds.width, height: bounds.height });
  }
  return { success: true };
});

ipcMain.handle('devops:window:resize', async (_event: IpcMainInvokeEvent, width: number, height: number) => {
  if (mainWindow) {
    const nextWidth = Math.max(SHIMEJI_MIN_WINDOW_WIDTH, Math.round(Number(width) || SHIMEJI_MASCOT_WINDOW_WIDTH));
    const nextHeight = Math.max(SHIMEJI_MIN_WINDOW_HEIGHT, Math.round(Number(height) || SHIMEJI_MASCOT_WINDOW_HEIGHT));
    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching({ x: bounds.x, y: bounds.y, width: nextWidth, height: nextHeight });
    const { workArea } = display;
    const clampedX = Math.round(Math.max(workArea.x, Math.min(bounds.x, workArea.x + workArea.width - nextWidth)));
    const clampedY = Math.round(Math.max(workArea.y, Math.min(bounds.y, workArea.y + workArea.height - nextHeight)));
    mainWindow.setBounds({ x: clampedX, y: clampedY, width: nextWidth, height: nextHeight });
  }
  return { success: true };
});

ipcMain.handle('devops:window:set-ignore-mouse-events', async (_event: IpcMainInvokeEvent, ignore: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
  }
  return { success: true };
});

ipcMain.handle('devops:ai:get-settings', async () => {
  return {
    success: true,
    settings: aiSettingsManager.getSafeSettings(),
  };
});

ipcMain.handle('devops:ai:save-settings', async (_event: IpcMainInvokeEvent, request: any) => {
  const settings = aiSettingsManager.save(request || {});
  return {
    success: true,
    settings: aiSettingsManager.redact(settings),
  };
});

ipcMain.handle('devops:ai:complete-setup', async () => {
  return {
    success: true,
    settings: aiSettingsManager.redact(aiSettingsManager.markSetupComplete()),
  };
});

ipcMain.handle('devops:ai:get-status', async () => {
  try {
    return {
      success: true,
      ...(await aiRouter.getStatus()),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('devops:ai:set-active-backend', async (_event: IpcMainInvokeEvent, activeBackend: AIBackend) => {
  return {
    success: true,
    settings: await aiRouter.setActiveBackend(activeBackend),
  };
});

ipcMain.handle('devops:ai:execute-prompt', async (_event: IpcMainInvokeEvent, request: any) => {
  try {
    const result = await aiRouter.executePrompt(String(request?.prompt || ''), {
      systemPrompt: request?.systemPrompt,
      maxTokens: request?.maxTokens,
      temperature: request?.temperature,
    });
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('devops:ai:pull-ollama-model', async (event: IpcMainInvokeEvent) => {
  const settings = aiSettingsManager.load();
  try {
    await ollamaClient.pullModel(settings.local.model, (progress) => {
      event.sender.send('devops:ai:ollama-pull-progress', progress);
    }, settings.local.baseUrl);
    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    event.sender.send('devops:ai:ollama-pull-progress', {
      model: settings.local.model,
      status: message,
      progress: 0,
      raw: message,
      done: true,
      error: message,
    });
    return {
      success: false,
      error: message,
    };
  }
});

ipcMain.handle('devops:ai:cancel-ollama-pull', async () => {
  const cancelled = ollamaClient.cancelPull();
  return {
    success: true,
    cancelled,
  };
});

ipcMain.handle('devops:code-fixer:fix', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { code, language, mode = 'ai' } = request;
    
    if (!code) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Code is required',
      };
    }

    const response = mode === 'manual'
      ? await aiClient.fixCodeManually(code, language)
      : await aiClient.fixCode(code, null, language);
    
    if (!response?.success) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: response?.error || 'Failed to fix code',
        errorType: response?.errorType || 'UNKNOWN',
        mode,
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      fixed: response.data?.fixed_snippet || '',
      explanation: response.data?.explanation || '',
      mode,
      modelUsed: mode === 'ai' ? 'gemini' : undefined,
      tokensUsed: response.tokens ? response.tokens.input + response.tokens.output : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
      errorType: 'UNKNOWN',
    };
  }
});

ipcMain.handle('devops:clipboard:read', async () => {
  try {
    const { clipboard } = require('electron');
    const text = clipboard.readText();
    return {
      success: true,
      content: text,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
});

ipcMain.handle('devops:code-fixer:agent', async (_event: IpcMainInvokeEvent, request: any) => {
  const started = Date.now();
  try {
    const {
      projectPath,
      scope,
      mode = 'ai',
      instruction = 'Fix the bug safely.',
      filePath,
      code,
      apply = false,
    } = request || {};

    if (!scope || !['clipboard', 'file', 'codebase'].includes(scope)) {
      return createErrorResponse(started, 'Invalid code fixer scope');
    }

    const rootDir = projectPath || process.cwd();
    const context = scope === 'clipboard'
      ? null
      : await buildProjectContext(rootDir, scope === 'file' ? filePath : undefined);
    const targetCode = scope === 'clipboard'
      ? (code || '')
      : scope === 'file'
        ? await readProjectTextFile(rootDir, filePath)
        : '';

    if (scope !== 'codebase' && !targetCode.trim()) {
      return createErrorResponse(started, 'No code was provided for the selected scope');
    }

    let aiResponse: any;
    if (mode === 'manual') {
      aiResponse = await runManualCodeFixAgent({
        rootDir,
        scope,
        filePath,
        code: targetCode,
        context,
      });
    } else {
      const language = inferLanguage(filePath || '', targetCode);
      const response = await aiClient.fixCodeWithContext({
        instruction,
        target: targetCode,
        language,
        projectContext: context,
        scope,
      });
      if (!response.success) {
        return {
          status: 'error',
          requestId: 'unknown',
          timestamp: Date.now(),
          duration: Date.now() - started,
          error: response.error || 'AI code fixer failed',
          errorType: response.errorType || 'UNKNOWN',
        };
      }
      aiResponse = normalizeCodeFixAgentData(response.data);
    }

    const fileDiffs = await buildCodeFixFileDiffs(rootDir, scope, targetCode, aiResponse.changes || []);

    let applyResult = { filesChanged: 0, warnings: [] as string[] };
    if (apply && scope !== 'clipboard') {
      applyResult = await applyCodeFixChanges(rootDir, aiResponse.changes || []);
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: Date.now() - started,
      mode,
      scope,
      summary: aiResponse.summary || 'Code fix analysis complete',
      confidence: Number(aiResponse.confidence || 0),
      changes: aiResponse.changes || [],
      fileDiffs,
      filesScanned: context?.files?.length || 0,
      filesChanged: applyResult.filesChanged,
      applied: Boolean(apply && scope !== 'clipboard'),
      warnings: [...(aiResponse.warnings || []), ...applyResult.warnings],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(started, message);
  }
});

ipcMain.handle('devops:project:get-current-path', async () => {
  try {
    return {
      success: true,
      path: process.cwd(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
      path: null,
    };
  }
});

ipcMain.handle('devops:chat:codebase', async (_event: IpcMainInvokeEvent, request: any) => {
  const started = Date.now();
  try {
    const { projectPath, message, history = [] } = request || {};
    if (!projectPath) return createErrorResponse(started, 'Project path is required');
    const text = String(message || '').trim();
    if (!text) return createErrorResponse(started, 'Message is required');

    if (isLightweightChatMessage(text)) {
      return {
        status: 'success',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: Date.now() - started,
        response: 'Hi. Ask me about a bug, file, architecture question, or change you want to make in this project.',
        filesScanned: 0,
      };
    }

    const context = await buildProjectContext(projectPath);
    const response = await aiClient.chatWithCodebase(text, context, history);
    if (!response.success) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: Date.now() - started,
        error: response.error || 'Chat failed',
        errorType: response.errorType || 'UNKNOWN',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: Date.now() - started,
      response: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
      filesScanned: context.files.length,
      tokensUsed: response.tokens ? response.tokens.input + response.tokens.output : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(started, message);
  }
});

ipcMain.handle('devops:discussion:create', async (_event: IpcMainInvokeEvent, request: any) => {
  try {
    const key = randomBytes(4).toString('hex').toUpperCase();
    const result = await ensureDiscussionRoom(request?.projectPath || process.cwd(), key, true);
    return { success: true, key, content: result.content, path: result.path };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
});

ipcMain.handle('devops:discussion:join', async (_event: IpcMainInvokeEvent, request: any) => {
  try {
    const key = sanitizeRoomKey(request?.key);
    const result = await ensureDiscussionRoom(request?.projectPath || process.cwd(), key, true);
    return { success: true, key, content: result.content, path: result.path };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
});

ipcMain.handle('devops:discussion:read', async (_event: IpcMainInvokeEvent, request: any) => {
  try {
    const key = sanitizeRoomKey(request?.key);
    const roomPath = getDiscussionRoomPath(request?.projectPath || process.cwd(), key);
    const content = await fsExtra.readFile(roomPath, 'utf8');
    const stat = await fsExtra.stat(roomPath);
    return { success: true, key, content, updatedAt: stat.mtimeMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
});

ipcMain.handle('devops:discussion:write', async (_event: IpcMainInvokeEvent, request: any) => {
  try {
    const key = sanitizeRoomKey(request?.key);
    const roomPath = getDiscussionRoomPath(request?.projectPath || process.cwd(), key);
    await fsExtra.ensureDir(path.dirname(roomPath));
    await fsExtra.writeFile(roomPath, String(request?.content || ''), 'utf8');
    const stat = await fsExtra.stat(roomPath);
    return { success: true, key, updatedAt: stat.mtimeMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
});

// ============================================================================
// ENVIRONMENT BUILDER - IPC HANDLERS
// ============================================================================

ipcMain.handle('devops:env:detect', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { projectPath } = request;
    
    if (!projectPath) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Project path is required',
      };
    }

    // Perform project scan
    const scan = await performProjectScan(projectPath);
    
    // Call AI to analyze
    const response = await aiClient.analyzeEnvironment(scan);
    
    if (!response?.success) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: response?.error || 'Failed to detect environment',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      ...response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

ipcMain.handle('devops:env:setup', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { projectPath, envType } = request;
    
    if (!projectPath) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Project path is required',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      success: true,
      stdout: 'Environment setup initiated',
      commandsExecuted: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

// ============================================================================
// FILE ORGANIZER - IPC HANDLERS
// ============================================================================

ipcMain.handle('devops:file:organize', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { folderPath, mode = 'professional', instruction = '' } = request;
    
    if (!folderPath) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Folder path is required',
      };
    }

    const organization = await generateOrganizerPlan(folderPath, instruction, mode === 'ai' ? 'ai' : 'professional');

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      ...organization,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

ipcMain.handle('devops:file:apply-org', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { folderPath, organization, dryRun = false } = request;
    
    if (!folderPath || !organization) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Folder path and organization plan are required',
      };
    }

    const executor = new SafeFileOperationExecutor(folderPath);
    const operations = legacyPlanToOperations(organization);
    const result = await executor.apply(operations, { dryRun });

    return {
      status: result.success ? 'success' : 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      success: result.success,
      filesProcessed: result.fileOperationCount ?? result.appliedCount,
      directoriesProcessed: result.directoryOperationCount ?? 0,
      operationsProcessed: result.appliedCount,
      errors: result.errors,
      rollbackBatchId: result.rollbackBatchId,
      rollbackLogPath: result.rollbackLogPath,
      error: result.errors.length > 0 ? result.errors.join('\n') : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

// ============================================================================
// DIALOG HANDLERS
// ============================================================================

ipcMain.handle('devops:dialog:select-path', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });

    if (result.canceled) {
      return {
        success: false,
        path: null,
        canceled: true,
      };
    }

    return {
      success: true,
      path: result.filePaths[0] || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
      path: null,
    };
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createErrorResponse(started: number, error: string) {
  return {
    status: 'error',
    requestId: 'unknown',
    timestamp: Date.now(),
    duration: Date.now() - started,
    error,
  };
}

function isLightweightChatMessage(message: string): boolean {
  const normalized = message.trim().replace(/[.!?]+$/g, '').toLowerCase();
  return /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay)( there)?$/.test(normalized);
}

async function buildCodeFixFileDiffs(rootDir: string, scope: string, clipboardCode: string, changes: any[]): Promise<any[]> {
  if (!Array.isArray(changes) || changes.length === 0) return [];

  if (scope === 'clipboard') {
    let fixed = clipboardCode || changes[0]?.original || '';
    for (const change of changes) {
      if (typeof change?.original === 'string' && fixed.includes(change.original)) {
        fixed = fixed.replace(change.original, String(change.fixed || ''));
      } else if (typeof change?.fixed === 'string') {
        fixed = change.fixed;
      }
    }
    return [{
      path: 'Clipboard snippet',
      original: clipboardCode || changes[0]?.original || '',
      fixed,
      changes,
    }];
  }

  const grouped = new Map<string, any[]>();
  for (const change of changes) {
    if (!change?.path) continue;
    grouped.set(change.path, [...(grouped.get(change.path) || []), change]);
  }

  const fileDiffs: any[] = [];
  for (const [relativePath, fileChanges] of grouped) {
    try {
      const original = await readProjectTextFile(rootDir, relativePath);
      let fixed = original;
      for (const change of fileChanges) {
        if (typeof change?.original === 'string' && fixed.includes(change.original)) {
          fixed = fixed.replace(change.original, String(change.fixed || ''));
        }
      }
      fileDiffs.push({
        path: relativePath,
        original,
        fixed,
        changes: fileChanges,
      });
    } catch {
      fileDiffs.push({
        path: relativePath,
        original: fileChanges.map((change) => change.original || '').join('\n\n'),
        fixed: fileChanges.map((change) => change.fixed || '').join('\n\n'),
        changes: fileChanges,
      });
    }
  }

  return fileDiffs;
}

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.vite',
  '__pycache__',
  '.shimeji-trash',
]);

const CONTEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.md',
  '.py',
  '.java',
  '.go',
  '.rs',
  '.cs',
  '.php',
  '.rb',
  '.yml',
  '.yaml',
  '.toml',
]);

function inferLanguage(filePath: string, code: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
  };
  if (map[ext]) return map[ext];
  if (code.includes('def ')) return 'python';
  if (code.includes('function ') || code.includes('const ')) return 'javascript';
  return 'text';
}

async function readProjectTextFile(rootDir: string, relativePath: string): Promise<string> {
  if (!relativePath) return '';
  const absoluteRoot = path.resolve(rootDir);
  const absolutePath = path.resolve(absoluteRoot, relativePath);
  if (!absolutePath.startsWith(absoluteRoot)) {
    throw new Error('File path is outside the selected project');
  }
  return fsExtra.readFile(absolutePath, 'utf8');
}

async function buildProjectContext(rootDir: string, focusPath?: string): Promise<any> {
  const absoluteRoot = path.resolve(rootDir);
  const files: any[] = [];
  const maxFiles = focusPath ? 1 : 80;
  const maxFileBytes = 24_000;

  const addFile = async (absolutePath: string) => {
    const stat = await fsExtra.stat(absolutePath);
    if (!stat.isFile() || stat.size > 500_000) return;
    const ext = path.extname(absolutePath).toLowerCase();
    if (!CONTEXT_EXTENSIONS.has(ext)) return;
    const rel = path.relative(absoluteRoot, absolutePath);
    const content = await fsExtra.readFile(absolutePath, 'utf8');
    files.push({
      path: rel,
      language: inferLanguage(rel, content),
      size_bytes: stat.size,
      content: content.slice(0, maxFileBytes),
      truncated: content.length > maxFileBytes,
    });
  };

  if (focusPath) {
    await addFile(path.resolve(absoluteRoot, focusPath));
  } else {
    const walk = async (dir: string) => {
      if (files.length >= maxFiles) return;
      const entries = await fsExtra.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) break;
        if (entry.name.startsWith('.') && entry.name !== '.github') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name)) await walk(full);
        } else if (entry.isFile()) {
          await addFile(full).catch(() => undefined);
        }
      }
    };
    await walk(absoluteRoot);
  }

  return {
    root: absoluteRoot,
    files,
    files_scanned: files.length,
  };
}

function normalizeCodeFixAgentData(data: any) {
  const changes = Array.isArray(data?.changes)
    ? data.changes.map((change: any) => ({
        path: change.path || undefined,
        original: String(change.original || ''),
        fixed: String(change.fixed || ''),
        explanation: String(change.explanation || ''),
        confidence: Math.max(0, Math.min(1, Number(change.confidence || data.confidence || 0))),
      })).filter((change: any) => change.original && change.fixed)
    : [];
  const confidence = changes.length
    ? changes.reduce((sum: number, change: any) => sum + change.confidence, 0) / changes.length
    : Math.max(0, Math.min(1, Number(data?.confidence || 0)));

  return {
    summary: String(data?.summary || 'Code fix analysis complete'),
    confidence,
    changes,
    warnings: Array.isArray(data?.warnings) ? data.warnings.map(String) : [],
  };
}

async function runManualCodeFixAgent(input: {
  rootDir: string;
  scope: 'clipboard' | 'file' | 'codebase';
  filePath?: string;
  code: string;
  context?: any;
}) {
  const changes: any[] = [];
  const files = input.scope === 'codebase'
    ? input.context?.files || []
    : [{ path: input.filePath, content: input.code, language: inferLanguage(input.filePath || '', input.code) }];

  for (const file of files) {
    const response = await aiClient.fixCodeManually(file.content, file.language);
    if (response.success && response.data?.fixed_snippet && response.data.fixed_snippet !== file.content) {
      changes.push({
        path: input.scope === 'clipboard' ? undefined : file.path,
        original: file.content,
        fixed: response.data.fixed_snippet,
        explanation: response.data.explanation || 'Manual rule-based fix',
        confidence: Number(response.data.confidence || 0.65),
      });
    }
  }

  return {
    summary: changes.length ? `Manual fixer found ${changes.length} change(s).` : 'Manual fixer did not find safe rule-based changes.',
    confidence: changes.length ? changes.reduce((sum, change) => sum + change.confidence, 0) / changes.length : 0.4,
    changes,
    warnings: input.scope === 'codebase' ? ['Manual codebase mode only applies conservative rule-based fixes.'] : [],
  };
}

async function applyCodeFixChanges(rootDir: string, changes: any[]) {
  const absoluteRoot = path.resolve(rootDir);
  let filesChanged = 0;
  const warnings: string[] = [];

  for (const change of changes) {
    if (!change.path) continue;
    const absolutePath = path.resolve(absoluteRoot, change.path);
    if (!absolutePath.startsWith(absoluteRoot)) {
      warnings.push(`Skipped path outside project: ${change.path}`);
      continue;
    }
    if (!await fsExtra.pathExists(absolutePath)) {
      warnings.push(`Skipped missing file: ${change.path}`);
      continue;
    }
    const current = await fsExtra.readFile(absolutePath, 'utf8');
    if (!current.includes(change.original)) {
      warnings.push(`Skipped ${change.path}: original text no longer matches`);
      continue;
    }
    await fsExtra.writeFile(absolutePath, current.replace(change.original, change.fixed), 'utf8');
    filesChanged++;
  }

  return { filesChanged, warnings };
}

function createProfessionalOrganizationPlan(scan: any, instruction: string = '') {
  const moves: any[] = [];
  const newDirs = new Set<string>();
  const redundant: any[] = [];
  const protectedNames = new Set([
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'tsconfig.json',
    'vite.config.ts',
    'vite.config.js',
    'README.md',
    'LICENSE',
  ]);

  const targetFor = (file: any): string | null => {
    const p = String(file.path || '').replace(/\\/g, '/');
    const name = path.posix.basename(p);
    const ext = path.posix.extname(p).toLowerCase();
    if (!p || p.includes('/') || protectedNames.has(name) || name.startsWith('.')) return null;
    if (/_backup|_old| copy|\.bak$/i.test(name)) return '.shimeji-trash';
    if (['.md', '.txt', '.pdf'].includes(ext) && name !== 'README.md') return `docs/${name}`;
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg'].includes(ext)) return `assets/${name}`;
    if (['.ps1', '.sh', '.bat', '.cmd'].includes(ext)) return `scripts/${name}`;
    if (['.test.ts', '.test.js', '.spec.ts', '.spec.js'].some((suffix) => name.endsWith(suffix))) return `tests/${name}`;
    if (['.env.example', '.editorconfig', '.prettierrc', '.eslintrc'].includes(name)) return `config/${name}`;
    return null;
  };

  for (const file of scan.files || []) {
    const p = String(file.path || '').replace(/\\/g, '/');
    const name = path.posix.basename(p);
    if (/_backup|_old|\.bak$/i.test(name)) {
      redundant.push({
        path: p,
        reason: 'Professional cleanup archives obvious backup/old files instead of leaving them in the active tree.',
        action: 'ARCHIVE',
      });
      continue;
    }
    const target = targetFor(file);
    if (target && target !== p && target !== '.shimeji-trash') {
      moves.push({
        from: p,
        to: target,
        reason: instruction || 'Professional convention groups loose top-level files by role.',
      });
      newDirs.add(path.posix.dirname(target));
    }
  }

  return {
    redundant_files: redundant,
    moves,
    new_dirs_to_create: Array.from(newDirs).filter((dir) => dir && dir !== '.'),
    summary: moves.length || redundant.length
      ? `Professional organization found ${moves.length} move(s) and ${redundant.length} archive candidate(s).`
      : 'Project already matches the conservative professional organization rules.',
    risk_level: moves.some((move) => /\.(ts|tsx|js|jsx|py|java|go|rs)$/i.test(move.from)) ? 'medium' : 'low',
  };
}

function sanitizeRoomKey(key: string): string {
  const cleaned = String(key || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!cleaned) throw new Error('Room key is required');
  return cleaned;
}

function getDiscussionRoomPath(projectPath: string, key: string): string {
  return path.join(projectPath, '.devops-lite', 'rooms', `${sanitizeRoomKey(key)}.md`);
}

async function ensureDiscussionRoom(projectPath: string, key: string, create: boolean) {
  const roomPath = getDiscussionRoomPath(projectPath, key);
  await fsExtra.ensureDir(path.dirname(roomPath));
  if (!await fsExtra.pathExists(roomPath)) {
    if (!create) throw new Error('Discussion room does not exist');
    await fsExtra.writeFile(
      roomPath,
      `# DevOps Lite Room ${key}\n\nUse this shared note for development discussion.\n`,
      'utf8'
    );
  }
  return {
    path: roomPath,
    content: await fsExtra.readFile(roomPath, 'utf8'),
  };
}

async function performProjectScan(rootDir: string): Promise<any> {
  const fs = require('fs');
  const path = require('path');
  
  const files: any[] = [];
  const configFiles: string[] = [];
  
  const walkDir = (dir: string, depth: number = 0) => {
    if (depth > 3) return;
    
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const relPath = path.relative(rootDir, fullPath);
          files.push({ name: item, rel_path: relPath, size_kb: Math.ceil(stat.size / 1024) });
          
          if (['.json', '.toml', '.yaml', '.yml', '.xml'].some(ext => item.endsWith(ext))) {
            configFiles.push(relPath);
          }
        } else if (stat.isDirectory() && depth < 3) {
          walkDir(fullPath, depth + 1);
        }
      }
    } catch (error) {
      console.debug(`Error scanning ${dir}:`, error);
    }
  };
  
  walkDir(rootDir);
  
  return {
    root: rootDir,
    files,
    has_pom: files.some(f => f.name === 'pom.xml'),
    has_package_json: files.some(f => f.name === 'package.json'),
    has_requirements: files.some(f => f.name === 'requirements.txt'),
    has_cargo: files.some(f => f.name === 'Cargo.toml'),
    has_go_mod: files.some(f => f.name === 'go.mod'),
    config_files: configFiles,
  };
}

async function performDeepScan(rootDir: string): Promise<any> {
  const fs = require('fs');
  const path = require('path');
  
  const files: any[] = [];
  const sizeGroups: Map<number, string[]> = new Map();
  
  const walkDir = (dir: string) => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === '__pycache__') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const relPath = path.relative(rootDir, fullPath);
          const size = stat.size;
          
          if (size > 100) {
            if (!sizeGroups.has(size)) sizeGroups.set(size, []);
            sizeGroups.get(size)!.push(relPath);
          }
          
          files.push({
            path: relPath,
            size_bytes: size,
            last_modified: stat.mtime.toISOString(),
            extension: path.extname(item),
          });
        } else if (stat.isDirectory()) {
          walkDir(fullPath);
        }
      }
    } catch (error) {
      console.debug(`Error scanning ${dir}:`, error);
    }
  };
  
  walkDir(rootDir);
  
  const potentialDupes: string[][] = [];
  sizeGroups.forEach((paths) => {
    if (paths.length > 1) potentialDupes.push(paths);
  });
  
  return {
    files,
    potential_duplicates_by_size: potentialDupes,
  };
}

