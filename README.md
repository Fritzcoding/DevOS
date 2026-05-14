# DevOps Lite

⚡ **An intelligent AI-powered DevOps assistant** that floats on your desktop as a Shimeji-style widget. Powered by Google Gemini and built with advanced architectural patterns: event-driven pub/sub messaging, state machines for concurrent safety, and strict process boundaries between renderer and main process.

DevOps Lite demonstrates modern software engineering best practices including **event bus patterns**, **state machine concurrency control**, **Electron IPC architecture**, **structured LLM prompting**, and **plugin-style feature extensibility**.

## What DevOps Lite Does

DevOps Lite provides three intelligent tools that integrate seamlessly into your development workflow:

### 🪄 **Code Auto Fixer** — One-Click AI Code Repair
- **Watches your clipboard** for code snippets
- **Analyzes errors** using Google Gemini with structured JSON schema prompting
- **Shows a side-by-side diff viewer** with syntax highlighting for instant review
- **Confidence scoring** so you know which fixes are safest
- **Multi-language support** — works with any code language Gemini understands

### ⚙️ **Environment Builder** — Automated Setup Generation
- **Deep project scanning** to detect tech stack (Node.js, Python, Java, Go, Rust, etc.)
- **Intelligent analysis** of dependencies, build files, and configuration
- **Generates platform-specific setup steps** (install, configure, run) for Windows/macOS/Linux
- **Handles complex environments** — mono-repos, Docker, containers, virtual environments
- **Output to console or file** for easy sharing and documentation

### 📁 **File Organizer** — Intelligent Project Restructuring
- **Deep-scans projects** to identify architecture patterns and redundancies
- **Detects code smell** — duplicate files, misplaced modules, unused assets
- **Proposes restructuring plans** in an interactive preview overlay
- **Applies changes safely** — user confirms before any file moves
- **Maintains referential integrity** — automatically updates imports and cross-references

## Advanced Architecture & Technologies

DevOps Lite showcases enterprise-grade software engineering patterns:

### 🏗️ **Pattern: Event-Driven Pub/Sub Architecture**
- **Event Bus** (`src/core/event-bus.ts`) implements a type-safe, decoupled message passing system
- **Real-time progress updates** push from features to UI via structured events
- **Event naming convention**: `feature:<name>:<event>` (e.g., `feature:code-fixer:progress`)
- **Enables loose coupling** between business logic and UI rendering

### 🔄 **Pattern: State Machine Concurrency Control**
- **State Machine** (`src/core/state-machine.ts`) enforces valid state transitions
- **Prevents race conditions** by serializing feature execution (IDLE → RUNNING → IDLE)
- **Hooks system** for pre/post-transition logic and validation
- **Guarantees single feature runs at a time** despite async JavaScript

### 🔗 **Architecture: Strict Process Boundary (Electron IPC)**
- **Renderer Process** (`src/`) — React UI only, cannot access file system or shell
- **Main Process** (`electron/main.ts`) — All Node.js APIs (fs, child_process, shell), no React
- **IPC Bridge** (`electron/preload.ts`) — Type-safe window.electronAPI methods
- **Security by design** — eliminates entire classes of vulnerabilities (file access exploitation, arbitrary code execution)

### 🤖 **Pattern: Structured LLM Prompting with JSON Schema**
- **Schema-first approach**: Every Gemini prompt includes a literal JSON schema
- **Deterministic parsing** — enforces `raw.replace(/```json|```/g, '').trim()` for safety
- **Confidence scoring** embedded in response schemas
- **Handles edge cases** — malformed output gracefully degrades to safe defaults

### ⚡ **Build & Packaging Pipeline**
- **Vite** for blazing-fast HMR during development
- **TypeScript** for type safety across all layers
- **electron-builder** for cross-platform (Windows/macOS) distribution
- **npm** workspaces ready for monorepo expansion

## Quick Start

```bash
# Install dependencies
npm install

# Create API key file (get free key at https://ai.google.dev/)
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Run development server (Vite + Electron)
npm run dev
```

## Documentation

Comprehensive documentation organized in **.github/**:

| File | Purpose |
|------|---------|
| **project-context.md** | Architecture, features, current state, build instructions |
| **copilot-instructions.md** | Development guidelines, process boundaries, coding standards |
| **handoff.md** | Active work, blockers, next steps |
| **roadmap.md** | Development phases and timeline |
| **problems.md** | Known issues and resolution status |
| **agents.md** | Dev environment tips and workflows |

## Development Commands

```bash
# Development
npm run dev              # Run Vite + Electron (full stack)
npm run dev:vite        # Vite dev server only
npm run dev:watch       # TypeScript watch mode

# Production
npm run build            # Build optimized bundle and package
npm run build:web        # Web assets only (no packaging)

# Quality Assurance
npm run type-check       # TypeScript validation
npm run lint             # ESLint validation
```

## Tech Stack & Dependencies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS | Component-based UI with type safety and styling |
| **Build & Dev** | Vite | Fast HMR, optimized production builds |
| **Desktop** | Electron | Cross-platform desktop application |
| **AI/LLM** | Google Gemini API | Natural language understanding and code generation |
| **Packaging** | electron-builder | Cross-platform executable and installer creation |
| **Runtime** | Node.js 18+ | JavaScript runtime for main process |
| **Code Editor** | Monaco Editor | Syntax highlighting in diff viewer |
| **Architecture** | Event Bus + State Machine | Decoupled, concurrent-safe feature coordination |

## Why These Patterns Matter

### For Developers
- **Event Bus** makes features extensible — add new features without modifying existing code
- **State Machine** prevents bugs from concurrent operations — async operations safely serialize
- **Process Boundary** eliminates security vulnerabilities — no accidental file system access from UI

### For Teams
- **Clean Architecture** enables easy onboarding — clear separation of concerns
- **DevOps Best Practices** — demonstrates CI/CD-friendly design with proper testing hooks
- **Type Safety** throughout — TypeScript prevents entire classes of runtime errors

## Project Structure

```
devops-lite/
├── src/
│   ├── components/          # React UI components
│   │   ├── Shimeji.tsx      # Main floating widget
│   │   ├── DebugPanel.tsx   # Real-time event logger
│   │   └── overlays/        # Feature-specific overlays
│   ├── features/            # Feature implementations
│   │   ├── code-fixer/
│   │   ├── environment-builder/
│   │   └── file-organizer/
│   ├── core/                # Architecture patterns
│   │   ├── event-bus.ts     # Pub/sub implementation
│   │   └── state-machine.ts # Concurrency control
│   ├── services/            # Utility services
│   │   └── ai/
│   │       └── ai-client.ts # Gemini API wrapper
│   └── types.ts             # Global TypeScript definitions
├── electron/
│   ├── main.ts              # Electron main process (all Node APIs)
│   └── preload.ts           # IPC interface definitions
├── .github/                 # Documentation
│   ├── copilot-instructions.md
│   └── project-context.md
└── package.json
```

## Environment Setup

### Prerequisites
- **Node.js 18+** (download from nodejs.org)
- **npm 9+** (comes with Node.js)
- **Windows 10+** or **macOS 10.15+**

### Get a Free Gemini API Key
1. Visit https://ai.google.dev/
2. Click "Get API Key"
3. Create a new project
4. Generate an API key for "Gemini 1.5 Flash"

### Installation & First Run
```bash
# Clone or extract the repository
cd devops-lite

# Install all dependencies
npm install

# Create environment file with your API key
echo "GEMINI_API_KEY=your-key-from-ai-google-dev" > .env.local

# Start development server
npm run dev

# Application will launch in Electron window
# Click the floating button to access features
```

## API Reference

### Using Features Programmatically

Each feature exports a clean interface for integration:

```typescript
// Code Fixer
import { fixCode } from './features/code-fixer/code-fixer';
const result = await fixCode(brokenCode, language);

// Environment Builder  
import { analyzeProject } from './features/environment-builder/environment-builder';
const steps = await analyzeProject(folderPath, platform);

// File Organizer
import { organizeProject } from './features/file-organizer/file-organizer';
const plan = await organizeProject(folderPath);
```

### Event Bus: Listen to Feature Updates

```typescript
import { eventBus } from './core/event-bus';

// Listen for code fixer progress
eventBus.on('feature:code-fixer:progress', (data) => {
  console.log('Progress:', data.percentage);
});

// Emit custom events
eventBus.emit('custom:event:name', { payload: 'data' });
```

## Known Issues & Troubleshooting

See [problems.md](.github/problems.md) for detailed troubleshooting and resolutions.

**Critical**: Current issues with `npm run dev` — see [roadmap.md](.github/roadmap.md) Phase 2 for planned fixes.

## Contributing

See [agents.md](.github/agents.md) for development environment setup and workflows.

Developers should follow the guidelines in [copilot-instructions.md](.github/copilot-instructions.md) for:
- Process boundary rules (renderer vs main process)
- AI prompting patterns with JSON schemas
- Event bus naming conventions
- State machine transition patterns

## License

See LICENSE file or check repository for license details.
