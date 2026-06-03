---
name: testing
description: Choose and run focused verification for DevOps Lite changes, including type checks and manual Electron smoke tests.
---

# Testing

Use this skill when adding verification or deciding what to run after changes.

## Default Verification

1. Run `npm run type-check` for TypeScript and IPC contract changes.
2. Run `npm run build` for packaging, preload, or Electron main-process changes
   when time allows.
3. Use `npm run dev:vite` for renderer-only UI checks.
4. Use `npm run dev` for end-to-end Electron smoke checks.

## Manual Smoke Checklist

- App launches without a blank renderer.
- Shimeji/menu opens and closes.
- AI settings flow can report local/cloud status.
- Code fixer returns a diff or a typed failure.
- Environment builder returns setup steps or a typed failure.
- File organizer shows a preview before apply.
- Debug/progress events appear for long-running flows.

## When Tests Are Missing

This repository does not currently have a dedicated unit test suite. For risky
logic, add focused tests only if the project already has enough harness support;
otherwise document the manual verification performed and the remaining gap.
