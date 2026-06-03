# File Organizer Instructions

The file organizer is the highest-risk feature because it can modify user
projects. Preserve its preview-first and reversible design.

## Current Model

Feature code lives under `src/features/file-organizer/`:

- `file-organizer.ts`: feature-facing orchestration.
- `ai-codebase-organizer.ts`: AI-assisted plan generation.
- `engine/plan-adapter.ts`: converts legacy plans into executable operations.
- `engine/safe-file-operation-executor.ts`: validates, applies, and logs file operations.
- `rules/safety.ts`: protected path and operation rules.
- `database/rollback-store.ts`: rollback record persistence.
- `ipc/contracts.ts` and `workers/contracts.ts`: typed boundaries for future isolation.

## Required Flow

1. Scan the selected root with protected paths excluded.
2. Generate a plan using heuristics and, when requested, the AI client.
3. Normalize the plan into typed operations.
4. Show the preview in the renderer.
5. Validate sandbox, conflicts, protected paths, and operation risk.
6. Apply only after explicit confirmation.
7. Write rollback records for applied operations.
8. Return structured errors instead of throwing through the app lifecycle.

## Protected Content

Never move, delete, or rewrite these without explicit user intent and a dedicated
review path:

- `.git`, `.github`, `.codex`, `node_modules`, `dist`, build outputs, caches.
- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, and other lockfiles.
- `.env`, `.env.local`, secrets, keys, certificates, and credential stores.
- Rollback logs and organizer metadata.

## Autonomous Behavior

Autonomous apply must remain disabled unless the code path enforces high
confidence, low risk, dry-run validation, and user-visible recovery data.
