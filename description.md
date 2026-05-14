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
- **Google Gemini AI (Gemini 1.5 Flash)**: Primary AI model for natural language processing
- **Google Generative AI SDK**: Official SDK for Gemini API integration
- **OpenAI SDK**: Alternative AI provider support (optional)

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
The application uses Electron to create a frameless, always-on-top window that behaves like a desktop mascot. The React frontend provides a modern, animated interface with smooth transitions. AI integration through Gemini enables intelligent code analysis and generation. The architecture follows a clean separation between main process (system operations) and renderer process (UI), with IPC communication for secure inter-process data exchange.

The three core features are implemented as modular services that can be triggered via the floating UI or system tray integration, making the assistant accessible without disrupting the development environment.</content>
<parameter name="filePath">c:\Users\Fritz\Downloads\devops-lite\description.md