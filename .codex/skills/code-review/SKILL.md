---
name: code-review
description: Review changes for defects, regressions, missing tests, unsafe AI behavior, and Electron boundary violations.
---

# Code Review

Use this skill for review requests or before finalizing risky changes.

## Review Order

1. Inspect `git diff --stat` and relevant diffs.
2. Prioritize correctness, data loss, security, and regression risks.
3. Check Electron process boundaries.
4. Check IPC contract consistency.
5. Check AI output validation and fallback handling.
6. Check file operation safety and rollback behavior.
7. Check verification coverage.

## Findings Format

Lead with findings ordered by severity. Each finding needs:

- File and line reference.
- The concrete failure mode.
- Why it matters.
- A concise remediation.

If there are no findings, say so and identify remaining test gaps or residual risk.

## Common Risks

- Renderer imports `fs`, `path`, `child_process`, or `electron`.
- Preload exposes broad primitives instead of narrow methods.
- IPC handler accepts unvalidated paths or untyped payloads.
- Model output is trusted without schema validation.
- File organizer applies moves without preview, sandbox validation, or rollback.
- TypeScript source and JavaScript mirrors drift in runtime-critical paths.
