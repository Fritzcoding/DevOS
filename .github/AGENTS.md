# DevOps Lite Agent Guide

This file is the global contract for AI coding agents working in this repository.
Keep it short, durable, and free of feature-specific implementation detail. Load
the focused files in `.github/instructions/` only when the task needs them.

## Project Model

DevOps Lite is an Electron + React + TypeScript desktop app. It runs as a
Shimeji-style floating widget and exposes AI-assisted developer tools:

- Code Auto Fixer: repairs clipboard or selected code and shows a diff.
- Environment Builder: scans a project folder and produces setup steps.
- File Organizer: scans a folder, proposes file moves, and applies them only
  after preview and confirmation.
- Codebase chat and discussion-room flows: inspect local project context and
  persist user-facing collaboration artifacts.

The Electron main process is rooted at `main.ts`; the preload bridge is rooted at
`preload.ts`; the renderer app lives under `src/`.

## Load Order

Use these files as needed instead of copying their rules here:

- `.github/instructions/architecture.md`: process boundaries, data flow, and key modules.
- `.github/instructions/conventions.md`: TypeScript, React, IPC, naming, and style rules.
- `.github/instructions/safety.md`: filesystem, AI, secrets, and autonomous-action guardrails.
- `.github/instructions/file-organizer.md`: advanced file organizer architecture and safety model.
- `.github/project-context.md`, `.github/problems.md`, `.github/roadmap.md`, and `.github/handoff.md`:
  planning and active-work context. Treat these as mutable project notes, not
  absolute architecture law.

## Non-Negotiable Rules

- Do not bypass `src/services/ai/ai-client.ts` for feature-facing AI calls.
  `ai-client.ts` delegates to `src/services/ai-routing/AIRouter.ts`.
- Do not import `electron`, `fs`, `path`, or `child_process` from renderer
  components. Node and Electron APIs belong in `main.ts` and must be exposed
  through `preload.ts`.
- Do not write to user-selected folders without an explicit preview, validation,
  and confirmation path. Dry-run behavior must be the default for file
  organization.
- Do not change unrelated features, generated JavaScript mirrors, documentation,
  or planning notes unless the task requires it.
- Do not add dependencies until existing APIs and dependencies have been checked.
  New dependencies must have a specific reason.
- Do not commit secrets, API keys, `.env.local`, model credentials, or local
  machine paths.
- Preserve user changes in a dirty worktree. Never reset, checkout, or overwrite
  unrelated files to make a task easier.

## Architecture Boundaries

- `main.ts`: Electron lifecycle, windows, tray, IPC handlers, filesystem,
  process execution, dialogs, and privileged operations.
- `preload.ts`: context-isolated API exposed to the renderer with narrow methods.
- `src/App.tsx` and `src/components/`: renderer UI and overlays only.
- `src/core/`: event bus and state machine.
- `src/services/ai/` and `src/services/ai-routing/`: AI gateway, local/cloud
  routing, settings, and Ollama integration.
- `src/features/`: feature orchestration and domain logic.
- `src/features/file-organizer/engine/`: validated, reversible file operation logic.

## Development Commands

- Install: `npm install`
- Dev app: `npm run dev`
- Vite only: `npm run dev:vite`
- Type check: `npm run type-check`
- Lint alias: `npm run lint` currently runs `tsc --noEmit`
- Build: `npm run build`

There is no dedicated automated test suite in this repository today. For risky
changes, add focused tests or document the manual verification performed.

## Expected Agent Workflow

1. Inspect the relevant files before editing.
2. Identify the smallest safe change that satisfies the request.
3. Update `main.ts`, `preload.ts`, `src/window.d.ts`, and `src/ipc-types.ts`
   together when adding or changing IPC.
4. Keep AI prompts schema-driven and parse defensively.
5. Preserve preview-first behavior for anything that touches user files.
6. Run `npm run type-check` after code changes when feasible.
7. Report any skipped verification and why.

## Generated JavaScript Mirrors

This repo contains TypeScript source files and compiled JavaScript mirrors such
as `main.js`, `preload.js`, and several `src/**/*.js` files. Prefer editing the
TypeScript source. Only update JavaScript mirrors when the current workflow or
user request depends on them being current.

## Instruction Hygiene

Keep persistent agent context modular:

- Put global rules here.
- Put subsystem knowledge in `.github/instructions/*.md`.
- Put procedural workflows in `.codex/skills/*/SKILL.md`.
- Avoid duplicating the same rule across files; link to the source of truth.
