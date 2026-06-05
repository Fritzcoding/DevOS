# Environment Builder

Environment Builder scans a selected project and produces setup guidance for the detected stack.

## Current Integration

```txt
Renderer project action
  -> preload `detectEnv(projectPath)`
  -> main IPC `devops:env:detect`
  -> project scan
  -> active AI route
  -> `SetupStepsOverlay`
```

The output is a structured setup plan with detected project type, missing tools, setup commands, required environment variables, estimated minutes, and a short summary.

## Safety Strategy

- Hidden folders, `node_modules`, and Python cache folders are ignored during scans.
- The feature should present setup commands before execution.
- `.env*` files can be detected as config signals, but real secret values must never be exposed in docs, logs, or committed fixtures.
- Command execution should stay in the Electron main process behind IPC.

## Resettable Test Fixture

```bash
npm run reset:test-fixtures
npm run test
```

Fixture source lives in `tests/fixtures/pristine/environment-node-python`. Tests copy it to `tests/fixtures/workdir/environment-node-python`, then verify stack/config detection and ignored dependency directories.
