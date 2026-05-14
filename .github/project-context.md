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
- AI: Google Gemini API (Free tier available)
- Code Parsing: Monaco Editor
- Build: Vite + electron-builder
- Package Manager: npm

## Key Architecture Components

### Core Layer
- Event Bus (src/core/event-bus.ts) - Pub/sub pattern for decoupled communication
- State Machine (src/core/state-machine.ts) - Enforces valid state transitions
- AI Client (src/services/ai/ai-client.ts) - Unified interface to Gemini API

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

Create .env.local with API key:
  GEMINI_API_KEY=your-key-here

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
