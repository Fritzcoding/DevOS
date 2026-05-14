# AGENTS.md — DevOps Lite

> Guidance for AI coding agents (Claude Code, Copilot, Cursor, Windsurf, etc.)
> working inside this repository.

---

## 1. Project Mental Model

DevOps Lite is an **Electron + React desktop app** that floats on the user's screen
as a Shimeji-style widget. The UI shell is working. **The three core features are
wired as stubs** — the goal is to make them fully functional:

| Feature | Entry Point | What it must do |
|---|---|---|
| Code Auto Fixer | `src/features/code-fixer/code-fixer.ts` | Watch clipboard → detect code → call AI → return diff |
| Environment Builder | `src/features/environment-builder/environment-builder.ts` | Scan a chosen folder → call AI → return ordered setup steps |
| File Organizer | `src/features/file-organizer/file-organizer.ts` | Deep-scan folder → call AI → preview + apply restructure plan |

The Shimeji widget, tray, window management, and overlay components **already
render**. All integration work lives in the feature files and the bridge between
them and the React UI.

---

## 2. Repo Layout (only what agents touch)

```
src/
  core/
    event-bus.ts          ← pub/sub; use emitAndWait for async flows
    state-machine.ts      ← guards against concurrent feature runs
  services/
    ai/
      ai-client.ts        ← single gateway to Gemini; always use this
  features/
    code-fixer/
      code-fixer.ts       ← PRIMARY TARGET
    environment-builder/
      environment-builder.ts  ← PRIMARY TARGET
    file-organizer/
      file-organizer.ts   ← PRIMARY TARGET
  components/
    DiffViewer/           ← already built; receives {original, fixed} props
    SetupStepsOverlay/    ← already built; receives Step[] prop
    OrganizationPlanOverlay/ ← already built; receives Plan prop
    DebugPanel/           ← reads event-bus logs; no changes needed
  electron/
    main.ts               ← IPC handlers live here; add new ones here only
    preload.ts            ← exposes safe APIs to renderer
```

---

## 3. Constraints Every Agent Must Respect

1. **Never bypass `ai-client.ts`** — do not instantiate `GoogleGenerativeAI` or
   any HTTP client directly in feature files.
2. **Never write to the user's filesystem without showing a preview first** — the
   File Organizer must go through `OrganizationPlanOverlay` before any
   `fs.rename`/`fs.unlink` call.
3. **All Node.js / Electron APIs** (fs, path, clipboard, dialog) must be called in
   `electron/main.ts` and exposed via IPC. Never import `electron` or `fs` in
   renderer-side files.
4. **State machine first** — call `stateMachine.transition('FEATURE_START')` before
   any long-running work and `stateMachine.transition('FEATURE_END')` in the
   finally block.
5. **Emit progress events** — use `eventBus.emit('progress', {step, total, message})`
   so DebugPanel and overlays stay in sync.
6. **TypeScript strict mode is on** — every function must have explicit return types;
   no `any` unless unavoidable and commented.
7. **No new dependencies without a comment** explaining why an existing utility
   couldn't solve it.

---

## 4. IPC Channel Naming Convention

```
devops:<feature>:<action>
```

Examples:
- `devops:code-fixer:fix`
- `devops:env-builder:scan`
- `devops:file-organizer:preview`
- `devops:file-organizer:apply`
- `devops:clipboard:read`

Register in `electron/main.ts` with `ipcMain.handle(channel, handler)`.
Expose in `electron/preload.ts` via `contextBridge.exposeInMainWorld`.

---

## 5. AI Prompt Engineering Rules

When writing prompts inside feature files:

- **Always include a JSON schema in the prompt** and instruct the model to respond
  only with valid JSON matching that schema.
- **Wrap the schema in triple backticks with `json` language tag** inside the
  prompt string.
- **Strip markdown fences** before `JSON.parse()` — use the helper:
  ```ts
  const clean = raw.replace(/```json|```/g, '').trim();
  ```
- **Add a fallback** — if parsing fails, surface the raw string to DebugPanel and
  return a typed error result rather than throwing.
- **Temperature** should be set to `0.2` for structured output tasks (fixer,
  organizer) and `0.5` for descriptive tasks (env builder).

---

## 6. Testing Checklist Before Committing

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] Manual smoke test: launch with `npm run dev`, open each feature, verify overlay
      renders with real (not mock) data
- [ ] DebugPanel shows expected events in correct order
- [ ] State machine does not allow two features to run simultaneously (test by
      clicking two features rapidly)
- [ ] File Organizer dry-run does NOT move any files before user confirms

---

## 7. PR / Commit Guidelines

- One commit per feature implementation (`feat(code-fixer): implement clipboard watcher and AI repair`)
- Always reference the failing flow in the PR description: _"Before: clicking fix did nothing. After: diff overlay opens with repaired code."_
- Include a screenshot or terminal log snippet of the feature working.

---

## 8. Common Pitfalls

| Pitfall | Fix |
|---|---|
| `require('fs')` in renderer | Move to `main.ts`, expose via IPC |
| Gemini returns prose instead of JSON | Add explicit JSON-only instruction + schema to prompt |
| Overlay never opens | Check that `eventBus.emit('overlay:open', ...)` is called after AI resolves |
| State machine stuck in `RUNNING` | Ensure `finally` block always calls `FEATURE_END` transition |
| Clipboard watcher fires on non-code text | Add heuristic check (e.g. contains `;` or `{`) before calling AI |
| `npm run dev` exits code 1 | Run `npm run type-check` first — almost always a TypeScript error |