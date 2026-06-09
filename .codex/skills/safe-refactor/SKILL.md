---
name: safe-refactor
description: Plan and execute behavior-preserving code changes with bounded scope, type safety, and verification.
---

# Safe Refactor

Use this skill when changing existing code without intending to alter behavior.

## Procedure

1. Identify the exact behavior that must remain unchanged.
2. Read the owning files and direct callers before editing.
3. Check for generated mirrors or contracts that must stay in sync.
4. Make the smallest cohesive change.
5. Preserve public APIs unless the task explicitly requires changing them.
6. Run the narrowest useful verification, usually `npm run type-check`.
7. Report changed files, verification, and any residual risk.

## DevOps Lite Checks

- Renderer changes must not introduce Node or Electron imports.
- IPC changes must update `main.ts`, `preload.ts`, `src/window.d.ts`, and
  `src/ipc-types.ts` together.
- AI routing changes must keep feature calls behind `src/services/ai/ai-client.ts`.
- File organizer changes must preserve preview-first and rollback-safe behavior.

## Stop Conditions

Stop and reassess when the change requires broad rewrites, data migration,
dependency replacement, or user-file mutation beyond the requested scope.
