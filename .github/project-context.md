# DevOps Lite - Project Context

## Project Overview

DevOps Lite is an AI-powered Electron desktop application that helps developers with three core tasks:
1. Code Auto Fixer - Repairs errors in code snippets using AI
2. Environment Builder - Analyzes projects and generates automated setup steps  
3. File Organizer - Identifies redundancy and restructures projects intelligently

The application runs as a borderless, always-on-top floating Electron window on the desktop with a system tray presence.

## Technology Stack

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Desktop: Electron
- Runtime: Node.js 18+
- AI: Cloud REST APIs (OpenAI-compatible/Anthropic-style) and Local Ollama
- Code Parsing: Monaco Editor
- Build: Vite + electron-builder
- Package Manager: npm

## Key Architecture Components

### Core Layer
- Event Bus (src/core/event-bus.ts) - Pub/sub pattern for decoupled communication
- State Machine (src/core/state-machine.ts) - Enforces valid state transitions
- AI Client (src/services/ai/ai-client.ts) - Feature-facing AI gateway
- AI Router (src/services/ai-routing/AIRouter.ts) - Routes prompts to Cloud AI or Local Ollama
- AI Settings Manager (src/services/ai-routing/AISettingsManager.ts) - Persists user AI settings in `~/.devops-lite/ai-settings.json`

### Feature Layer
- Code Fixer (src/features/code-fixer/code-fixer.ts) - Clipboard-based code analysis and repair
- Environment Builder (src/features/environment-builder/environment-builder.ts) - Project scanning and setup generation
- File Organizer (src/features/file-organizer/file-organizer.ts) - Redundancy detection and file restructuring

### UI Components
- Shimeji - Main character window with floating button
- DiffViewer - Side-by-side code comparison with syntax highlighting
- SetupStepsOverlay - Ordered step execution with progress tracking
- OrganizationPlanOverlay - Preview and apply file reorganization plans
- DebugPanel - Real-time logging and state inspection

## Current Feature Status

| Feature | Status | Implementation |
|---------|--------|-----------------|
| Code Fixer | Complete | Clipboard watcher, AI repair, diff viewer, confidence scoring |
| Environment Builder | Complete | Project scanner, AI analysis, multi-platform setup steps |
| File Organizer | Complete | Deep scanning, redundancy detection, preview/apply pattern |
| Event Bus | Complete | Type-safe pub/sub, emitAndWait, cleanup |
| State Machine | Complete | Transition validation, hooks, concurrent state prevention |
| UI Overlays | Complete | DiffViewer, SetupStepsOverlay, OrganizationPlanOverlay |

## Build & Run

Install dependencies:
  npm install

AI setup:
  - Cloud AI: open AI Settings, paste an API key, and choose a model string such as `gpt-4o-mini` or `deepseek-chat`.
  - Local AI: install/start Ollama, confirm `http://localhost:11434` is reachable, and download `qwen2.5-coder:7b`.
  - If `'ollama' is not recognized as an internal or external command`, Ollama is running but the CLI is not on PATH. DevOps Lite falls back to the HTTP pull API when possible. To fix the CLI permanently, reinstall/update Ollama and verify `ollama --version` in a new terminal.

Development:
  npm run dev              # Runs Vite + Electron
  npm run dev:vite        # Vite only
  npm run dev:watch       # TypeScript watch mode

Production:
  npm run build            # Compiles, builds, packages
  npm run build:web        # Web assets only

Validation:
  npm run type-check       # TypeScript check
  npm run lint             # Lint TypeScript

Shimeji interaction:
  - Left-click the Shimeji icon to open the feature menu.
  - Left-click the Shimeji icon again to close the feature menu.
  - Right-click the Shimeji icon for tray/settings actions.

## Known Environment

- Working Directory: c:\Users\Fritz\Downloads\devops-lite
- OS: Windows
- Node Version: 18+ required
- Last Dev Command: npm run dev (exited with code 1)

## Documentation

- ARCHITECTURE.md - Detailed layer breakdown, implementation decisions, security
- DEVELOPER_GUIDE.md - Quick start, debugging guide, architecture walkthrough
- IMPLEMENTATION_SUMMARY.md - Delivery checklist and feature completeness
- AGENTS.md - Dev environment tips, testing, PR guidelines
