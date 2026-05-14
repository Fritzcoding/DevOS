# DevOps Lite - Known Problems & Solutions

## Overall Status
- **Application State**: Runs but has UI and functionality issues
- **Total Open Issues**: 6
- **Total Resolved**: 0
- **Last Updated**: 2026-05-14

---

## Problem 1: Shimeji Icon Shows as Square Instead of Circular Shape

**Status**: 🔴 OPEN
**Severity**: Medium
**Impact**: UI/UX

### Description
- **Current Behavior**: The Shimeji floating button appears as a **square window** with Windows taskbar styling
- **Expected Behavior**: Should appear as a **circular (rounded-full) icon** that floats on the desktop
- **User Impact**: UI doesn't match design; looks unprofessional; doesn't feel like a desktop companion

### Root Cause Analysis

The issue is a **mismatch between CSS styling and Electron window rendering**:

1. **Window Dimensions**: Created as 100x120 (rectangular)
2. **CSS Styling**: Uses 
ounded-full for circle effect
3. **Problem**: Electron shows rectangular window bounds, CSS circle is only content inside
4. **Result**: User sees rectangle, not circle

### Why It Failed
- Electron transparency set but window bounds remain rectangular at OS level
- CSS assumes content viewport, not Electron window frame
- Windows doesn't render non-rectangular windows without special masking
- Developer testing focused on functionality, not UI rendering

### Solutions

**Quick Fix - Change window to 64x64 square**
`	ypescript
// main.ts lines 104-105
width: 64,
height: 64,
`

**Better Fix - Add CSS masking**
`	ypescript
mainWindow.webContents.executeJavaScript(
  document.body.style.borderRadius = '50%';
  document.body.style.overflow = 'hidden';
);
`

---

## Problem 2: Duplicated Shimeji Icons (Appears Twice or More)

**Status**: 🔴 OPEN
**Severity**: High
**Impact**: Resource/Usability

### Description
- **Current Behavior**: Running \
pm run dev\ creates 2 or more Shimeji windows
- **Expected Behavior**: Should create exactly 1 Shimeji window
- **User Impact**: Multiple windows confusing to use; wastes system resources

### Root Cause Analysis

Multiple \createWindow()\ calls due to:

1. Initial app start fires \pp.on('ready')\ → first window created
2. Vite hot reload fires app lifecycle events again → second window created  
3. No guard checking if window already exists
4. No cleanup when window closes

### Evidence in Logs
`
[APP] Ready                           # Event 1
[WINDOW] Creating borderless...       # Window 1 created
[VITE] reload detected
[APP] Ready                           # Event fires AGAIN!
[WINDOW] Creating borderless...       # Window 2 created ← DUPLICATE!
`

### Solutions

**Solution 1: Add Window Guard (Recommended)**
`	ypescript
function createWindow(): void {
  if (mainWindow !== null) {
    mainWindow.focus();
    return;  // Prevent duplicate
  }
  // ... create window
  mainWindow.on('closed', () => {
    mainWindow = null;  // Clean up reference
  });
}
`

**Solution 2: Use Single Instance Lock**
`	ypescript
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();  // Exit if another instance already running
}
`

---

## Problem 3: npm run dev Exits with Code 1

**Status**: 🔴 OPEN
**Severity**: Critical
**Impact**: Development/Blocking

### Description
- **Current Behavior**: Running `npm run dev` compiles but exits immediately with code 1
- **Expected Behavior**: Dev server should start and keep running (Vite + Electron)
- **Impact**: Blocks all development and testing work

### Root Cause
Unknown - need to investigate:
1. Vite dev server not staying alive
2. Electron process not connecting
3. TypeScript compilation issue in main.ts
4. Missing dependency or environment variable

### Investigation Steps
- Run `npm run compile:main` separately to verify TypeScript compilation
- Run `npm run dev:vite` to test Vite in isolation
- Check console output for error messages
- Verify .env.local exists with GEMINI_API_KEY

### Solutions
See roadmap.md Phase 2 for detailed debugging steps.

---

## Problem 4: How to Terminate Duplicate Shimeji Icons

If you already have multiple windows open, use these commands to kill them:

### PowerShell Method (Recommended)
`powershell
# Kill all Electron processes
ps | Where-Object {.ProcessName -eq 'electron'} | Stop-Process -Force
`

### Task Manager Method
1. Press Ctrl+Shift+Esc
2. Find 'electron' or 'devops-lite' process
3. Right-click → End Task
4. Repeat for each duplicate

### Command Line Method
`cmd
taskkill /IM electron.exe /F
`

---

## Problem 5: Functionality Doesn't Work

**Status**: 🔴 OPEN
**Severity**: Critical
**Impact**: Feature/Core

### Description
- **App Status**: Runs and shows UI ✓
- **What's Broken**: Features don't actually do anything
  - Code Fixer: No API connection
  - Environment Builder: No detection/setup
  - File Organizer: No file operations  
  - Settings: Not functional

### Root Cause
1. IPC handlers exist but don't call actual services
2. AI services not connected to Gemini API
3. API key is test key, not real
4. No error handling or logging
5. Async operations not properly awaited

### Why It Failed
- Skeleton structure created but logic not implemented
- API integration planned but not coded
- No test data to verify functionality
- Error handling missing completely

### How to Fix

**Enable Debug Logging** (to see what's happening)
`	ypescript
// main.ts
ipcMain.handle(IPC_CHANNELS.FIX_CODE, async (event, request) => {
  console.log('[IPC] fix-code called with:', request);
  try {
    const result = await aiManager.fixCode(request.code);
    console.log('[IPC] Result:', result);
    return { status: 'success', fixed: result };
  } catch (error) {
    console.error('[IPC] Error:', error);
    return { status: 'error', error: String(error) };
  }
});
`

**Get Real API Key**
`ash
# 1. Visit https://ai.google.dev/
# 2. Click "Get API Key"
# 3. Copy your key
# 4. Update .env.local:
GEMINI_API_KEY=your-real-api-key-here

# 5. Restart app
npm run dev
`
---

## Problem 6: Shimeji Cannot Be Clicked or Dragged Reliably

**Status**: 🔴 OPEN
**Severity**: High
**Impact**: UX / Core Interaction

### Description
- **Current Behavior**: The Shimeji widget cannot be moved by dragging and left-click does not reliably open the feature menu.
- **Expected Behavior**: Clicking should open the menu and dragging should move the widget across the screen.
- **User Impact**: The app appears unresponsive and the main widget is unusable.

### Root Cause
- The Shimeji `mousedown` handler set drag state via React state only, and the document-level `mousemove`/`mouseup` listeners were attached after the render.
- Fast clicks or immediate drags could occur before those listeners were active, causing the widget to ignore interaction.

### Fix
- Attach pointer listeners immediately during `mousedown` instead of waiting for React state updates.
- Use refs to track active drag state and distance so clicks and drags are handled reliably.

### Why It Failed
- React state updates are asynchronous, so relying on `isDragging` to add global listeners was too slow for quick user input.
- This produced a mismatch between the expected interaction model and actual event handling.

**Implement AI Service**
`	ypescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIManager {
  async fixCode(code: string): Promise<string> {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(\Fix this code:\\);
    return result.response.text();
  }
}
`

---

## How to Report a Resolved Issue

When a problem is fixed:
1. Change **Status** from `🔴 OPEN` to `✅ RESOLVED`
2. Add **Fix Date**: 2026-MM-DD
3. Add **Fix Details**: Brief description of what was done
4. Move to "Resolved Issues" section at top

Example:
```
**Status**: ✅ RESOLVED (2026-05-15)
**Fix**: Changed window dimensions from 100x120 to 64x64 in main.ts
```

## Resolved Issues

(None yet - problems waiting to be fixed)

---

## Summary Table

| Issue | Severity | Status | Fix Time | Next Step |
|-------|----------|--------|----------|-----------|
| Shimeji is square | Medium | OPEN | 5 min | Change dimensions |
| Duplicate windows | High | OPEN | 10 min | Add window guard |
| Dev server exit code 1 | Critical | OPEN | TBD | Debug Vite/Electron |
| Features don't work | Critical | OPEN | 2 hours | Connect Gemini API |

