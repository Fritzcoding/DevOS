# GitHub Copilot Instructions — DevOps Lite

<!-- This file is read automatically by GitHub Copilot in VS Code. -->
<!-- It also applies to Copilot Chat, Copilot Edits, and agent mode. -->

## What this project is

An Electron + React + TypeScript desktop widget (Shimeji-style) that floats on
the developer's desktop and provides three AI-powered developer tools:

1. **Code Auto Fixer** — reads clipboard, detects code, repairs it with Gemini AI,
   shows a side-by-side diff overlay.
2. **Environment Builder** — scans a project folder and generates platform-specific
   setup steps (install, configure, run).
3. **File Organizer** — deep-scans a project, detects redundant/misplaced files,
   proposes a restructure plan, applies it only after user confirmation.

The widget UI renders. **The three features are stubs and need full implementation.**

---

## Architecture rules Copilot must follow

### Process boundary
- Renderer files live under `src/` and are React/TypeScript only.
- All Node.js APIs (`fs`, `path`, `child_process`, `electron`) belong in
  `electron/main.ts` only.
- Cross-process calls use IPC: `window.electronAPI.<method>()` in the renderer,
  `ipcMain.handle(channel, handler)` in main.

### AI calls
- All Gemini calls go through `src/services/ai/ai-client.ts`. Never import
  `@google/generative-ai` anywhere else.
- Always request JSON output. Include a literal JSON schema in every prompt and
  end with: _"Respond with only valid JSON matching the schema above. No markdown,
  no prose."_

### State management
- Import and use `src/core/state-machine.ts` to guard concurrent feature runs.
- Transition to `RUNNING` at the start of any feature, `IDLE` in the `finally`.

### Event bus
- Emit progress via `src/core/event-bus.ts` so the DebugPanel updates in real time.
- Event name pattern: `feature:<name>:<event>` e.g. `feature:code-fixer:progress`.

---

## Copilot suggestion preferences

- Prefer `async/await` over `.then()` chains.
- Prefer explicit TypeScript return types on every function.
- Prefer `const` over `let`; never use `var`.
- When generating IPC handlers, always add a matching entry in `electron/preload.ts`.
- When generating prompts for Gemini, always include JSON schema and parse-safety
  strip: `raw.replace(/```json|```/g, '').trim()`.
- When generating file-system operations, always wrap in a dry-run flag that
  defaults to `true` and only writes when `dryRun === false`.

---

## File map (quick reference)

```
src/core/event-bus.ts              pub/sub backbone
src/core/state-machine.ts          concurrency guard
src/services/ai/ai-client.ts       Gemini gateway
src/features/code-fixer/           IMPLEMENT THIS
src/features/environment-builder/  IMPLEMENT THIS
src/features/file-organizer/       IMPLEMENT THIS
src/components/DiffViewer/         done — accepts {original, fixed}
src/components/SetupStepsOverlay/  done — accepts Step[]
src/components/OrganizationPlanOverlay/ done — accepts Plan
electron/main.ts                   add IPC handlers here
electron/preload.ts                expose IPC here
```

---

## Do not do these things

- Do not add `require('fs')` or `require('electron')` inside `src/` (renderer).
- Do not skip the OrganizationPlanOverlay preview step and apply file changes
  directly.
- Do not create a second Gemini client instance outside `ai-client.ts`.
- Do not use `any` type without a `// TODO: narrow this type` comment.
- Do not add npm packages without checking if a built-in or existing dep covers it.

---

## Environment

- OS target: Windows (primary), macOS (secondary)
- Node: 18+
- Package manager: npm
- Build: `npm run build` (Vite + electron-builder)
- Dev: `npm run dev`
- Lint: `npm run lint`
- Types: `npm run type-check`