# DevOps Lite

## Description
DevOps Lite is a desktop AI-powered developer assistant that floats on your screen as a Shimeji-style character. It provides three core features to enhance developer productivity: automatic code fixing, environment setup generation, and project file organization.

## Technologies Used

### Core Framework
- **Electron**: Cross-platform desktop application framework
- **React 19**: Frontend UI library with hooks and modern features
- **TypeScript**: Type-safe JavaScript with full type checking
- **Vite**: Fast build tool and development server

### AI & Machine Learning
- **Cloud API routing**: OpenAI-compatible REST APIs such as OpenAI and DeepSeek, plus Anthropic-style message endpoints
- **Local AI routing**: Ollama running at `http://localhost:11434`
- **Default local model**: `qwen2.5-coder:7b`
- **Persistent AI settings**: User choices are stored in `~/.devops-lite/ai-settings.json`

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Modern icon library with consistent design
- **Motion**: Animation library for smooth UI transitions
- **Recharts**: Data visualization components

### Backend & System Integration
- **Node.js**: Runtime environment for Electron main process
- **Express.js**: Web server framework (for potential API features)
- **Socket.IO**: Real-time communication (client and server)
- **File System APIs**: Native file operations via Node.js fs
- **Clipboard APIs**: System clipboard monitoring and manipulation

### Development Tools
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking and compilation
- **Electron Builder**: Application packaging and distribution
- **Concurrent**: Development task orchestration

### Key Dependencies
- **@google/genai**: Google AI SDK for advanced features
- **@monaco-editor/react**: Code editor component
- **react-markdown**: Markdown rendering
- **p-queue**: Promise-based task queuing
- **fs-extra**: Enhanced file system operations

## Motivation
Modern development workflows involve repetitive tasks like debugging code, setting up environments, and organizing project files. DevOps Lite aims to automate these tasks using AI, providing developers with an always-available assistant that can:

- Instantly fix code errors by analyzing clipboard content
- Generate complete environment setup scripts for any project
- Automatically organize and restructure messy project directories
- Provide a distraction-free, floating interface that doesn't interrupt workflow

## Implementation Overview
The application uses Electron to create a frameless, always-on-top window that behaves like a desktop mascot. The React frontend provides a modern interface with setup flows for Cloud AI or Local AI. AI requests are routed through a central router so code fixing, chat, and project tools can switch between a saved cloud API key and a downloaded Ollama model. The architecture follows a clean separation between main process (system operations) and renderer process (UI), with IPC communication for secure inter-process data exchange.

The three core features are implemented as modular services that can be triggered via the floating UI or system tray integration, making the assistant accessible without disrupting the development environment.

## Local Ollama Setup Note
For Local AI, users must install and run Ollama first. The app checks the Ollama server at `http://localhost:11434/api/tags`. If `qwen2.5-coder:7b` is missing, the app can download it.

If the download reports `'ollama' is not recognized as an internal or external command`, the Ollama server is running but the `ollama` CLI is not available on the PATH for this app process. The app falls back to Ollama's HTTP pull API when possible. To fix the CLI permanently, install or update Ollama from https://ollama.com/download, restart DevOps Lite, and verify `ollama --version` in a new terminal.

The local setup UI lists Ollama models already installed on the device. `qwen2.5-coder:7b` is the default model, but users can choose another model string. Engine downloads show percentage progress and include a cancel action.

## Shimeji Menu Behavior
Left-clicking the Shimeji icon toggles the feature menu. If the menu is open, clicking the icon closes it so only the Shimeji remains visible.

During first-run AI setup, the Shimeji icon toggles the AI configuration panel instead of opening the feature menu behind it. The feature menu becomes available after AI setup is complete.
