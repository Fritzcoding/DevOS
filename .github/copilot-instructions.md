# GitHub Copilot Instructions

Copilot should treat `.github/AGENTS.md` as the source of truth for global
repository behavior.

Load these focused instruction files when relevant:

- `.github/instructions/architecture.md`
- `.github/instructions/conventions.md`
- `.github/instructions/safety.md`
- `.github/instructions/file-organizer.md`

Core reminders:

- Electron privileged work belongs in root `main.ts`; renderer code calls it
  through root `preload.ts`.
- Feature AI calls go through `src/services/ai/ai-client.ts`.
- File organization must be preview-first and dry-run by default.
- Add or update IPC contracts consistently across `src/ipc-types.ts`,
  `preload.ts`, `src/window.d.ts`, and `main.ts`.
- Prefer small typed changes, explicit return types, and `npm run type-check`
  verification.
