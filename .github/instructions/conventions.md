# Conventions Instructions

## TypeScript

- Prefer explicit return types on exported functions and public class methods.
- Prefer `const`; use `let` only for reassignment.
- Avoid `any`. If unavoidable, narrow it at the boundary or add a short TODO
  explaining what needs to be typed.
- Keep domain interfaces near the feature or contract that owns them.
- Edit TypeScript source first. Compiled JavaScript mirrors should only be
  updated when the workflow requires them.

## React

- Components live under `src/components/`.
- Keep components focused on rendering and user interaction. Move filesystem,
  AI orchestration, and command execution behind preload APIs or feature services.
- Keep overlay props typed and stable. Avoid passing raw AI responses directly to
  UI without validation or normalization.

## IPC

- Use `devops:<domain>:<action>` channel names.
- Validate request shape in `main.ts` before doing privileged work.
- Return typed success/error responses instead of throwing into the renderer.
- Keep preload methods narrow; expose actions, not raw `ipcRenderer`.

## AI Prompts

- For structured workflows, include a JSON schema and require JSON-only output.
- Strip optional markdown fences before parsing.
- Validate required fields before using model output.
- Return typed fallback errors when parsing fails; do not crash the app lifecycle.

## Dependencies

- Use existing dependencies and platform APIs first.
- Add a dependency only when it removes meaningful risk or complexity.
- Avoid adding packages for simple path, string, date, or collection operations.

## Documentation

- Keep durable architecture and workflow context in `.github/instructions/`.
- Keep active notes in `.github/handoff.md`, `.github/problems.md`, and
  `.github/roadmap.md`.
- Avoid repeating the same rule in multiple files.
