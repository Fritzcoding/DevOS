# DevOS

DevOS is a desktop assistant for developer workflows. It runs as an Electron app with a floating Shimeji-style launcher and provides:

- Code Fixer for clipboard snippets, single files, or small codebases
- Environment Builder for detecting project stacks and running reviewed setup commands
- File Organizer for preview-first, rollback-logged file moves
- AI Chat Repo for asking questions with repository context
- Dev Room for shared project notes with optional room sync and repo-aware AI
- AI and appearance settings for cloud/local AI, theme, mascot image, and motion

## Changes Made After Demo
- Enhanced the UI and Output of Code Fixer
- Upgraded Dev Room by implementing AI Chat Model for AI Integrated Development Chat Room.
- Upgraded README
- Enhanced AI option of API and Local LLM
- Enhanced Dev Room Auto-save and Connection
- Added further Documentation & New Demo Video
- Help feature Upgraded
  
## 1. Read This First

DevOS Lite can read project files and, when you choose apply/run actions, can write files or execute setup commands inside the selected project. For safe use:

- Start with the built-in samples before using a real project.
- Commit or back up any real project before running Code Fixer auto-apply, Environment setup commands, or File Organizer apply.
- Review every generated plan or diff before applying it.
- Keep API keys out of git. Use the app's AI Settings or `.env.local`; never commit real `.env*` files.

## 2. Requirements

Required for the current repo:

- Windows 10/11 recommended for the default Java build path
- Node.js `20.19.0` or newer
- npm `10` or newer
- Git
- Internet access for first install and Java dependency download
- Java 21 installed at `C:\java-21`

Optional:

- Ollama for local/private AI: <https://ollama.com/download>
- Python, Maven, Go, Rust, or other runtimes only if you use Environment Builder on projects that need them

Check your machine:

```bash
node --version
npm --version
C:\java-21\bin\javac.exe -version
```

The active preflight script enforces Node `20.19.0+` and npm `10+`. The active Java build script expects `C:\java-21\bin\javac.exe` and `C:\java-21\bin\jar.exe`.

### macOS/Linux Note

The Electron app is cross-platform in principle, but the current `npm run build:java`, `npm run setup`, and `npm run dev` path uses hardcoded Windows Java tool paths. On macOS/Linux, update `scripts/build-java.mjs` to use your local `javac`/`jar` path or build the Java module separately before expecting the npm scripts to pass.

## 3. Install From a Clean Checkout

```bash
git clone https://github.com/Fritzcoding/DevOS.git
cd DevOS
npm run preflight
npm run setup
```

What setup does:

- Installs npm dependencies.
- Compiles `main.ts` and `preload.ts` into Electron entry files.
- Builds `java/target/devos-services.jar`.
- Downloads Java helper dependencies into `java/target/lib` if missing.

Generated files such as `node_modules/`, `dist/`, `main.js`, `preload.js`, `java/target/`, `samples/workdir/`, and `.DevOS-lite/` should not be committed.

## 4. AI Setup

The app opens AI Settings on first launch until setup is complete. You can use either cloud AI or local AI.

### Cloud AI

1. Open the floating DevOS Lite menu.
2. Click `AI`.
3. Choose `Cloud AI`.
4. Pick a preset or enter your API URL.
5. Paste your API key.
6. Confirm the model name.
7. Click `Finish setup` or `Save settings`.

Cloud presets shown in the app:

- OpenAI: `https://api.openai.com/v1/chat/completions`, model `gpt-4o-mini`
- Gemini: `https://generativelanguage.googleapis.com/v1beta`, model `gemini-2.5-flash`
- DeepSeek: `https://api.deepseek.com/chat/completions`, model `deepseek-chat`
- Anthropic: `https://api.anthropic.com/v1/messages`, model `claude-3-5-haiku-latest`

Settings are saved locally at:

```txt
%USERPROFILE%\.devops-lite\ai-settings.json
```

You can also use an env file for Gemini-compatible setup:

```bash
copy .env.example .env.local
```

Then edit `.env.local` and set only what you need:

```env
GEMINI_API_KEY=
GOOGLE_API_KEY=
VITE_GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
```

### Local AI With Ollama

1. Install and start Ollama.
2. Open DevOS Lite `AI` settings.
3. Choose `Local AI`.
4. Keep the default URL `http://localhost:11434` unless your Ollama server is elsewhere.
5. Choose a model.
6. Click `Download Engine` if the selected model is not installed.
7. Click `Finish setup` or `Save settings`.

Default local model:

```bash
ollama pull qwen2.5-coder:7b
```

Larger models need more RAM/VRAM. If Ollama reports memory pressure, choose a smaller model such as `qwen2.5-coder:7b`, `llama3.1:8b`, `mistral:7b`, or `codellama:7b`.

### Switching AI Routes

When both cloud and local AI are ready, the feature menu shows an `AI route` toggle. Use it to switch between `Cloud` and `Local` for the current setup.

## 5. Run the App

Recommended:

```bash
npm run dev
```

On Windows you can also double-click or run:

```bat
start.bat
```

What happens:

- Vite starts the renderer dev server, usually at `http://localhost:5173`.
- Electron starts with `--shimeji`.
- The app appears as a small floating mascot near the top-left of the screen.
- The window may also create a system tray icon on Windows/macOS.

Stop the app from the terminal with `Ctrl+C`, or use `Deactivate` in the app menu. Closing/minimizing the window may hide it to the tray instead of quitting.

## 6. First Safe Trial With Samples

Before using a real project:

```bash
npm run reset:samples
```

Then launch the app and use the sample cards shown inside Code Fixer, Environment Builder, and File Organizer. Samples are copied from:

```txt
samples/pristine
```

to the mutable folder:

```txt
samples/workdir
```

Reset them any time with:

```bash
npm run reset:samples
```

## 7. Basic App Navigation

1. Click the floating mascot to open the feature menu.
2. Set `Project path`:
   - `Browse` selects a folder.
   - `Current` uses the repo folder from which Electron was launched.
3. Pick a feature.
4. Use `Back` to return to the menu or `X` to close a panel.
5. Use `Design` to change theme, mascot image, and mascot motion.
6. Use `Help` for in-app feature guidance.

Global shortcuts listed by the app:

- `Ctrl+Alt+C`: Code Fixer
- `Ctrl+Alt+E`: Environment Builder
- `Ctrl+Alt+O`: File Organizer
- `Ctrl+Shift+D`: Debug panel

## 8. Feature Guide

### Code Fixer

Use Code Fixer for focused repairs, not large unattended rewrites.

Scopes:

- `Clipboard`: reads the current clipboard text and previews a fixed snippet.
- `Single file`: reads a relative file path inside the selected project.
- `Codebase`: scans up to 80 supported text/source files and proposes changes across files.

Modes:

- `Manual rules`: conservative rule-based fixes.
- `AI agent`: uses the configured AI route.

Safe workflow:

1. Select a project path or a sample.
2. Choose `Clipboard`, `Single file`, or `Codebase`.
3. For single file, enter a relative path such as `src/App.tsx`.
4. Choose `Manual rules` or `AI agent`.
5. Write a precise fix instruction.
6. Click `Preview fix`.
7. Review the side-by-side before/after output.
8. Use `Auto apply fix` only after you trust the proposed replacement.

Important limits:

- Clipboard scope does not write to disk.
- File/codebase apply only replaces text when the original text still matches.
- Codebase context skips generated/heavy folders such as `.git`, `node_modules`, `dist`, `build`, `coverage`, `.next`, `.nuxt`, `.vite`, `__pycache__`, and `.shimeji-trash`.
- Very large files are skipped from context.

### Environment Builder

Environment Builder scans a selected project up to a shallow depth and generates setup steps without loading an LLM.

Detected markers include:

- `package.json`: Node/npm project
- `requirements.txt`: Python project
- `pom.xml`: Java/Maven project
- `Cargo.toml`: Rust project
- `go.mod`: Go project

Workflow:

1. Select the target project path.
2. Open `Environment`.
3. Click `Detect Environment`.
4. Review detected project type, missing tools, estimated time, and commands.
5. Run individual commands with the play button, or click `Run Required`.

Safety:

- Commands run in the selected project directory.
- Only commands generated in the setup plan can be executed from the overlay.
- Optional commands such as tests/start may be shown but are not part of `Run Required`.

### File Organizer

File Organizer builds a preview plan and applies moves only after confirmation.

Modes:

- `Professional sorting`: conservative rules for loose docs, assets, scripts, tests, logs, data, and models.
- `AI instruction`: uses your natural-language instruction for grouping/renaming where supported.

Workflow:

1. Select a project path or a sample.
2. Open `File Organizer`.
3. Choose `Professional sorting` or `AI instruction`.
4. Edit the sorting instruction.
5. Click `Create Plan`.
6. Review risk level, files to move, new directories, and before/after layout.
7. Click `Apply Changes` only if the plan is correct.

Safety:

- Paths are sandboxed inside the selected root.
- Protected paths include `.git`, `node_modules`, build outputs, lockfiles, `.env*`, `tsconfig.json`, `.devops-lite-organizer`, and trash/rollback internals.
- Move plans are validated for conflicts before touching the filesystem.
- Rollback metadata is written inside the selected project under `.devops-lite-organizer/rollback-<batch>.jsonl`.

### AI Chat Repo

Use AI Chat Repo to ask about bugs, files, architecture, tests, or implementation details in the selected project.

Workflow:

1. Select the project path.
2. Open `AI Chat Repo`.
3. Ask a concrete question.
4. Press `Enter` to send or `Shift+Enter` for a new line.

Notes:

- Chat history is stored in browser local storage per project path.
- The app scans supported text/source files and sends trimmed context to the configured AI route.
- Do not ask it to inspect files that are ignored or too large unless you paste the relevant content.

### Dev Room

Dev Room is a shared Markdown note attached to a room key, with an AI panel that can answer using the notes plus repo context.

Workflow:

1. Open `Dev Room`.
2. Click `Create` to make a room key, or enter a key and click `Join`.
3. Edit notes in the main editor.
4. Use `Save` or wait for autosave.
5. Ask questions in the `Ask AI` panel.

Local room files are saved under:

```txt
<project>\.DevOS-lite\rooms\<ROOMKEY>.md
```

Room sync:

- The app can start an internal sync server on ports `4777` through `4787`.
- The generated sync URL is shown in the Dev Room header.
- Another device on the same network can use that URL if firewalls allow the connection.
- A standalone sync server is also available:

```bash
npm run room-sync
```

By default the standalone server listens on port `8787` and stores data under `.devops-lite/remote-rooms`.

### Appearance Settings

Open `Design` from the feature menu to:

- Switch between light and dark theme.
- Change mascot motion: still, float, bob, or orbit.
- Choose a custom mascot image.
- Restore the default logo or reset all design settings.

## 9. Common Commands

```bash
npm run preflight            # Check Node/npm and warn about missing local env
npm run setup                # Install dependencies, compile Electron, build Java helper
npm run dev                  # Install if needed, compile, build Java, run Vite + Electron
npm run dev:vite             # Start only the Vite renderer server
npm run dev:shimeji          # Compile/build and run Electron in Shimeji mode
npm run build                # Compile, build Java, build renderer, type-check
npm run type-check           # TypeScript validation
npm run reset:samples        # Reset visible manual samples
npm run reset:test-fixtures  # Reset automated test fixtures
npm run test                 # Reset samples/fixtures and run feature tests
npm run verify               # Run tests and type-check
npm run room-sync            # Start standalone Dev Room sync server
```

Avoid `npm run clean` unless you intend to remove generated build artifacts and reinstall afterward. If cleanup causes install issues, restore `package-lock.json` from git and rerun `npm run setup`.

## 10. Verify The Project

Run:

```bash
npm run preflight
npm run verify
```

For a full launch check:

```bash
npm run dev
```

Then confirm:

- The Vite server reports a local URL.
- Electron opens the floating mascot.
- AI Settings can be saved.
- `npm run reset:samples` makes sample cards usable again.
- Code Fixer can preview a sample.
- Environment Builder detects a sample.
- File Organizer creates a plan for a sample.

## 11. Troubleshooting

### `preflight` Fails On Node Or npm

Install Node.js `20.19.0+` from <https://nodejs.org/> or use nvm/fnm/Volta. Then verify:

```bash
node --version
npm --version
```

### `package-lock.json is missing`

Restore it from git:

```bash
git checkout -- package-lock.json
npm run setup
```

Only do this if you did not intentionally edit the lockfile.

### Java Build Fails With `Java 21 not found at C:\java-21`

Install Java 21 at `C:\java-21`, or edit `scripts/build-java.mjs` so `javacPath` and `jarTool` point to your installed JDK.

Expected files:

```txt
C:\java-21\bin\javac.exe
C:\java-21\bin\jar.exe
```

### Java Dependency Download Fails

The Java build downloads Gson and SLF4J JARs from Maven Central into `java/target/lib`. Check internet access, proxy/VPN settings, and whether antivirus is blocking downloads. Rerun:

```bash
npm run build:java
```

### Vite Or Electron Is Not Recognized

Dependencies are missing or stale:

```bash
npm run setup
npm run dev
```

### App Opens Blank Or Cannot Find The Dev Server

Wait a few seconds; Electron probes ports `5173` through `5185`. If still blank:

```bash
npm run dev:vite
```

In another terminal:

```bash
npm run electron
```

Also check whether another process is occupying Vite ports.

### The Mascot Is Hard To Find

Look near the top-left of the screen and in the system tray. Double-click the tray icon or choose `Show`. In development, DevTools may open in a separate window.

### Cloud AI Says The API Key Is Missing

Open `AI` settings and paste the key again, or create `.env.local` from `.env.example`. Restart the app after changing env files.

### Cloud AI Returns Provider Errors

Check that the selected API URL, model, and key belong to the same provider. For example, an OpenAI key should use the OpenAI preset URL and a valid OpenAI chat model.

### Ollama Is Not Reachable

Start Ollama and verify:

```bash
ollama --version
ollama list
```

Then reopen AI Settings and click refresh. If the CLI is missing but the server is running, reinstall/update Ollama and restart your terminal and DevOS Lite.

### Ollama Model Is Missing

Use `Download Engine` in AI Settings or run:

```bash
ollama pull qwen2.5-coder:7b
```

### AI Responses Are Slow Or Fail On Codebase Tasks

Use a smaller scope:

- Clipboard instead of codebase
- Single file instead of whole project
- Manual rules instead of AI agent
- Smaller/faster local model or a cloud model with a larger context window

### Code Fixer Did Not Apply A Change

The app skips a replacement if the original text no longer matches the file. Rerun preview, review the diff, and apply again. Also check that the file path is inside the selected project.

### Environment Builder Command Fails

Copy the command shown in the overlay and run it manually in the selected project folder to see full output. Install any missing tool listed by the overlay, then rerun detection.

### File Organizer Refuses A Plan

The plan likely touched a protected path, escaped the selected root, renamed through a move operation, exceeded operation limits, or had destination conflicts. Adjust the instruction and create a new plan.

### File Organizer Applied The Wrong Moves

Use your git backup first if available. Also inspect the rollback log shown after apply:

```txt
<project>\.devops-lite-organizer\rollback-<batch>.jsonl
```

The automated tests verify rollback metadata, but the current UI primarily exposes the log path rather than a one-click rollback button.

### Dev Room Sync Does Not Work Across Devices

Check:

- Both devices are on the same network.
- The sync URL uses the host machine's reachable LAN IP.
- Firewall allows the selected port.
- Ports `4777` through `4787` are available for the internal server, or port `8787` for `npm run room-sync`.

### Tests Fail Because Samples Were Mutated

Reset fixtures and samples:

```bash
npm run reset:samples
npm run reset:test-fixtures
npm run test
```

## 12. Project Map For Users

Important files and folders:

- `main.ts`: Electron main process, IPC handlers, file/command access
- `preload.ts`: safe renderer bridge
- `src/App.tsx`: main React app state
- `src/components`: UI panels and modals
- `src/features/code-fixer`: code repair feature logic
- `src/features/environment-builder`: environment detection docs/logic
- `src/features/file-organizer`: planner, safety rules, executor, rollback metadata
- `src/services/ai-routing`: cloud/local AI route settings
- `src/services/ai`: AI client used by code/chat features
- `java/src/main/java`: Java helper service sources
- `samples/pristine`: reset source for manual samples
- `samples/workdir`: mutable manual sample copies
- `tests/fixtures/pristine`: reset source for automated fixtures
- `tests/fixtures/workdir`: mutable automated fixture copies

## 13. Security And Privacy

- Renderer code does not import Node/Electron APIs directly; file and command access is behind IPC.
- Cloud AI sends selected snippets or scanned repo context to the configured provider.
- Local AI uses Ollama at the configured local URL.
- AI settings are stored in your home directory and API keys are redacted in the UI.
- Real `.env*` files are ignored by git.
- Do not use File Organizer or Code Fixer auto-apply on uncommitted work you cannot afford to restore manually.
