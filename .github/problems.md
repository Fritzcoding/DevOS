# DevOps Lite - Known Problems & Solutions

## Overall Status
- **Application State**: Runs but has UI and functionality issues
- **Total Open Issues**: 6
- **Total Resolved**: 3
- **Last Updated**: 2026-05-26

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

### Problem 13: Code Fixer Review Was Too Cramped

**Status**: ✅ RESOLVED (2026-05-26)
**Severity**: Medium
**Impact**: Code review UX

#### Problem
Code Fixer displayed setup controls and generated changes in the same cramped panel. Codebase-scope fixes with multiple files were hard to inspect because each change was stacked inline.

#### Solution
- Code Fixer now has separate **Setup** and **Review** tabs.
- After a fix completes, the UI automatically opens the Review tab.
- Review mode shows changed files in a left sidebar.
- Selecting a file shows a whole-file before/after preview plus the individual proposed replacements.

### Problem 12: Shared Panel Size Caused Environment Builder Window Growth

**Status**: ✅ RESOLVED (2026-05-26)
**Severity**: High
**Impact**: Shimeji window sizing / UX

#### Problem
All panels reused one mutable `panelSize`. Chat resizing and observer-driven measurements could change that shared size, then unrelated features such as Environment Builder inherited it. Dragging the Shimeji while a panel was open could make the native transparent window feel like it was growing rapidly.

#### Root Cause
The app treated every overlay as if it should use the same manually resized panel dimensions. This coupled unrelated features and made window size changes propagate farther than intended.

#### Solution
- Replaced generic panel sizing with fixed native window sizes per feature.
- Kept manual resize only for Codebase Chat.
- Removed chat's automatic `ResizeObserver` panel-size feedback loop.
- Environment Builder now uses a stable feature-specific window size.

### Problem 8: Ollama Server Running but `ollama pull` Fails on Windows

**Status**: ✅ RESOLVED (2026-05-23)
**Severity**: Medium
**Impact**: Local AI setup

#### Problem
The Local AI setup screen could detect Ollama at `http://localhost:11434`, but clicking **Download Engine** failed with:

```text
'ollama' is not recognized as an internal or external command, operable program or batch file.
```

#### Root Cause
Ollama's local HTTP server can run even when the `ollama` command-line executable is not available on PATH for the Electron app process. This commonly happens on Windows after installation until the terminal/app is restarted, or when command-line access was not added correctly.

#### Solution
- `OllamaClient.pullModel` still tries `ollama pull qwen2.5-coder:7b` first.
- If the CLI is missing, it falls back to Ollama's local HTTP `/api/pull` streaming endpoint.
- The AI Settings UI now explains that the CLI may be missing from PATH.

#### User Fix
Install or update Ollama from https://ollama.com/download, restart DevOps Lite, open a new terminal, and verify:

```powershell
ollama --version
ollama pull qwen2.5-coder:7b
```

### Problem 9: Shimeji Click Only Opened Feature Menu

**Status**: ✅ RESOLVED (2026-05-23)
**Severity**: Low
**Impact**: UX

#### Problem
Clicking the Shimeji icon opened the feature menu, but clicking the icon again did not close the menu.

#### Solution
The Shimeji click handler now toggles the feature menu open/closed. When the menu is open, clicking the icon closes it and leaves only the Shimeji visible.

### Problem 10: First-Run AI Setup Allowed Feature Menu Behind Modal

**Status**: ✅ RESOLVED (2026-05-24)
**Severity**: Medium
**Impact**: First-run UX

#### Problem
On initial run, AI configuration was visible, but clicking the Shimeji icon opened the feature menu behind the AI setup panel.

#### Solution
The Shimeji click handler now controls the current top-level panel:
- Before AI setup is complete, clicking Shimeji toggles the AI configuration panel.
- The feature menu is suppressed while AI configuration is open or incomplete.
- After AI setup is complete, clicking Shimeji toggles the feature menu.

### Problem 11: Ollama Model Download Needed Progress, Cancel, and Model Detection

**Status**: ✅ RESOLVED (2026-05-24)
**Severity**: Medium
**Impact**: Local AI setup

#### Problem
Users needed to see real download percentage, cancel a running engine download, and select from local models already present on the device.

#### Solution
- AI Settings now displays detected Ollama models from `/api/tags`.
- `qwen2.5-coder:7b` remains the default local model, but users can choose another model string.
- Download Engine shows percentage progress.
- Active downloads can be cancelled through IPC.

### Problem 7: Shimeji Interactivity Jitter and Invisible Click Barrier

**Status**: ✅ RESOLVED (2026-05-21)
**Severity**: High
**Impact**: UX / Core Interaction

#### Problem
The Shimeji widget could be clicked, but hover and pointer movement caused visible jitter. The feature menu did not stay anchored near the widget, and transparent parts of the Electron window could block clicks to other apps.

#### Description
- Clicking sometimes failed to open the feature menu.
- Dragging moved both renderer state and native Electron window bounds, which made the widget feel unstable.
- The feature menu could appear far away from the Shimeji instead of beside it.
- The transparent Electron window could behave like an invisible click barrier.

#### Root Cause
The renderer and Electron main process both acted like sources of truth for position. The renderer kept local visual position state while also asking the main process to move the native `BrowserWindow`. The menu also relied on fixed screen placement instead of stable placement inside the Shimeji canvas.

#### Why It Failed
The previous implementation mixed DOM movement, native window movement, hover/click animations, and window resizing behavior. Those independent behaviors raced each other during pointer events, so small cursor movement could trigger repositioning or repainting at the wrong time.

#### Solution
- Removed renderer-owned widget position state and made the native `BrowserWindow` the only source of truth.
- Added a drag threshold before moving the native window.
- Clamped native movement in the main process using Electron `screen` work area bounds.
- Kept the Shimeji canvas at a stable fixed size and anchored the feature menu near the widget.
- Added dynamic `setIgnoreMouseEvents(true, { forward: true })` behavior so only marked interactive DOM elements capture clicks.
- Verified with `npm.cmd run type-check`, `npm.cmd run compile:main`, `npm.cmd run build:web`, feature smoke tests, and an Electron boot smoke test.

---

### Problem 14: AI File Organizer Count Mismatch and Missing User Categories

**Status**: ✅ RESOLVED (2026-05-27)
**Severity**: High
**Impact**: File Organizer correctness / user trust

#### Problem
The AI File Organizer preview could say it would move 7 files, but apply then
reported 9 files processed because directory creation operations were counted as
files. For the instruction to organize `sandbox_clutter` into `Documents`,
`Images`, `Financials`, and `Code` with snake_case names, several common files
such as `.docx`, `.js`, `.html`, `.csv`, and `.xlsx` were not moved as expected.
The planner also created generic folders like `assets` and `docs` instead of
honoring the user-named categories.

#### Root Cause
- Apply reporting used total applied operations as `filesProcessed`, including
  explicit `mkdir` operations.
- The legacy plan adapter created redundant `mkdir` operations even though file
  move operations already create parent folders.
- AI instruction category planning only recognized a narrow set of extensions
  and hardcoded generic target folders.
- Rename intent was not translated into explicit rename operations.

#### Solution
- User-facing `filesProcessed` now counts file operations only.
- Apply responses also expose directory and total operation counts separately.
- Redundant explicit `mkdir` operations were removed from the adapter.
- AI instruction grouping now supports requested `Documents`, `Images`,
  `Financials`, and `Code` categories.
- Added extension coverage for office documents, spreadsheets, CSV/TSV, images,
  HTML, JavaScript, TypeScript, scripts, and common source files.
- Added safe snake_case filename normalization and duplicate final-extension
  cleanup.
- Updated success messaging so `.devops-lite-organizer` is described as rollback
  metadata.

#### Verification
- `npm.cmd run type-check`
- `npm.cmd run compile:main`
- Re-ran `npm.cmd run type-check` after the UI success-message update.
- Generated a plan for `C:\Users\Fritz\Downloads\test\sandbox_clutter` with 12
  expected moves.
- Applied the plan to a temporary copy and verified 12 preview moves, 12 apply
  operations, 12 file operations, 0 directory operations, and 0 skipped files.

---

## Summary Table

| Issue | Severity | Status | Fix Time | Next Step |
|-------|----------|--------|----------|-----------|
| Shimeji is square | Medium | OPEN | 5 min | Change dimensions |
| Duplicate windows | High | OPEN | 10 min | Add window guard |
| Dev server exit code 1 | Critical | OPEN | TBD | Debug Vite/Electron |
| Features don't work | Critical | OPEN | 2 hours | Connect Gemini API |
| Shimeji jitter/click barrier | High | RESOLVED | Done | Fixed 2026-05-21 |
