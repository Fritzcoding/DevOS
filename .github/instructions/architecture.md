# Architecture Instructions

## Runtime Shape

DevOps Lite is an Electron desktop app with a React renderer:

- Root `main.ts`: privileged Electron main process.
- Root `preload.ts`: context-isolated IPC bridge.
- `src/main.tsx`: renderer bootstrap.
- `src/App.tsx`: top-level renderer application.
- `src/components/`: UI surfaces, modals, overlays, and Shimeji widget pieces.
- `src/features/`: feature orchestration.
- `src/services/`: AI routing, logging, task, queue, and permission services.
- `src/core/`: event bus and state machine.

## Process Boundary

Renderer code must not import privileged Node or Electron APIs. Any operation
that reads or writes files, opens dialogs, touches the clipboard, executes
commands, manages windows, or reads environment-level state belongs in `main.ts`
and is exposed through `preload.ts`.

When adding IPC, update these files together:

- `src/ipc-types.ts`: request/response contracts and channel constants when applicable.
- `preload.ts`: narrow `window.electronAPI` method.
- `src/window.d.ts`: renderer-visible API type.
- `main.ts`: `ipcMain.handle(...)` implementation.

Use channel names in the existing `devops:<domain>:<action>` style.

## AI Routing

Feature code calls `src/services/ai/ai-client.ts`. The AI client delegates to
`src/services/ai-routing/AIRouter.ts`, which chooses cloud API or local Ollama
based on saved settings.

Do not instantiate parallel model clients inside features. Add routing behavior
to the AI service layer instead.

## State and Events

Use `src/core/state-machine.ts` to guard long-running feature work. Use
`src/core/event-bus.ts` for renderer-visible progress, completion, failure, and
debug events.

Prefer deterministic event names and typed payloads. Avoid hidden state coupling
between components.

## Feature Boundaries

- `code-fixer`: code repair and diff data.
- `environment-builder`: project scan and setup-step analysis.
- `file-organizer`: scan, classify, preview, validate, apply, rollback.
- `ai-routing`: backend selection, settings persistence, model availability.

Keep shared behavior in services only when two or more features actually use it.
