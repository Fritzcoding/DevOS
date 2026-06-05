# Feature Execution Plan

This plan describes the target execution model for making Env Builder and File Organizer seamless on clean laptops and safe on real projects.

## Env Builder

1. Preflight the host laptop before feature use.
   - Check Node/npm versions, package manager lockfiles, optional tools like Python, Java, Docker, Git, and Ollama.
   - Return typed missing-tool results instead of raw shell failures.

2. Scan the selected project deterministically.
   - Detect package files, lockfiles, framework config, Docker files, language manifests, and `.env.example`.
   - Ignore generated folders such as `node_modules`, `dist`, `build`, `.git`, and caches.

3. Generate a preview setup plan.
   - Output platform-specific commands for Windows, macOS, and Linux.
   - Separate required commands, optional commands, environment variables, and verification commands.
   - Include exact expected output format so the UI can render consistently.

4. Execute only with explicit confirmation.
   - Run commands from the main process.
   - Stream stdout/stderr to the overlay.
   - Stop on required-step failure and show recovery steps.

5. Verify after setup.
   - Run commands such as `node --version`, `npm --version`, `python --version`, `docker --version`, or project-specific smoke commands.
   - Mark the project ready only after verification passes.

## File Organizer

1. Preflight the selected folder.
   - Confirm it exists, is writable when applying, and is inside the organizer sandbox root.
   - Reject protected paths before planning or applying.

2. Build a preview plan.
   - Use deterministic rules for common organization tasks.
   - Use AI only to enrich explanations or interpret explicit instructions.
   - Never move env files, lockfiles, `.git`, dependency folders, build outputs, or rollback internals.

3. Render the preview.
   - Show source, destination, reason, confidence, risk, and affected imports.
   - Require confirmation before apply.

4. Apply safely.
   - Validate all operations before touching files.
   - Create destination directories first.
   - Use atomic moves where possible.
   - Write rollback metadata to `.devops-lite-organizer`.

5. Roll back cleanly.
   - Read the rollback batch in reverse order.
   - Restore moved files to their original paths.
   - Keep rollback logs for auditability.

## Required Verification

- `npm run preflight`
- `npm run test`
- `npm run type-check`
- Manual Electron smoke when UI or IPC changes are made: `npm run dev`
