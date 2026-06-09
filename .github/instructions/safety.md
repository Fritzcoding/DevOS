# Safety Instructions

## Filesystem Safety

- Default to preview or dry-run for user folder operations.
- Resolve paths before applying file operations.
- Keep operations inside the selected project root unless the user explicitly
  chooses another path.
- Protect `.git`, `node_modules`, build outputs, lockfiles, `.env*`, credentials,
  and app-generated rollback metadata.
- Validate conflicts before moving, deleting, overwriting, or creating files.
- Prefer reversible operations and rollback logs for organizer changes.

## Electron Security

- Keep `nodeIntegration: false` and `contextIsolation: true`.
- Do not expose raw `ipcRenderer`, filesystem, shell, or environment access to
  the renderer.
- Keep preload APIs narrow and typed.

## AI Safety

- Treat model output as untrusted input.
- Validate JSON shape before using it.
- Do not apply model-proposed file changes without user preview and confirmation.
- Keep prompt context minimal and avoid sending secrets or `.env.local` content.

## Command Execution

- Do not execute generated setup commands automatically unless the user explicitly
  starts that action.
- Surface commands to the user before execution when they affect the machine.
- Capture and report failures without leaving state-machine workflows stuck.

## Worktree Safety

- This repository may have active user edits. Inspect relevant diffs before
  changing files that are already modified.
- Never reset, checkout, or delete unrelated changes.
- Keep infrastructure edits scoped to agent instruction files unless the task
  explicitly asks for application code changes.
