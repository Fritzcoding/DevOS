# DevOS Lite - Complete System Architecture

## Overview
DevOS Lite is an Electron-based desktop assistant with a Shimeji floating UI that provides 5 core features for developer workflows, powered by multi-model AI with intelligent fallback mechanisms.

---

## Architecture Diagram (Complete System)

```mermaid
graph TB
    subgraph "PRESENTATION LAYER - Frontend React UI"
        direction TB
        APP["<b>Main App (App.tsx)</b><br/>State & Navigation<br/>Panel Management<br/>UI Settings Management"]
        
        subgraph SHIMEJI["🎭 Shimeji Character"]
            MASCOT["Floating Mascot<br/>Draggable Mascot<br/>96x96 Window"]
            CONTEXT["Context Menu<br/>Feature Quick Access"]
        end
        
        subgraph FEATURES["5 Core Features UI"]
            CF["<b>Code Fixer</b><br/>- Clipboard Fix Mode<br/>- File Fix Mode<br/>- Codebase Scan Mode<br/>- Diff Viewer<br/>- Agent Overlay"]
            EB["<b>Environment Builder</b><br/>- Project Detection<br/>- Setup Steps Display<br/>- Workbench Panel<br/>- Setup Guidance"]
            FO["<b>File Organizer</b><br/>- Organization Plan<br/>- Preview/Dry-run<br/>- Apply Operations<br/>- Rollback Support<br/>- Workbench Panel"]
            CC["<b>AI Chat Repo</b><br/>- Real-time Chat<br/>- Context Awareness<br/>- Code References<br/>- Streaming Responses"]
            DR["<b>Discussion Room</b><br/>- Multi-user Chat<br/>- Room AI Questions<br/>- Socket.io Sync<br/>- Persistent Messages"]
        end
        
        subgraph MODALS["Modal Dialogs & Settings"]
            PATH["Path Input Modal"]
            HELP["Help Modal"]
            AIS["AI Settings Modal"]
            APPS["Appearance Settings"]
        end
        
        MENU["Feature Menu<br/>Navigation & Launcher"]
    end
    
    subgraph "COMMUNICATION LAYER - Electron IPC"
        direction TB
        PRELOAD["<b>Preload Bridge</b><br/>(preload.ts)<br/>- Safe API exposure<br/>- Event forwarding<br/>- Window API"]
        
        IPC_TYPES["<b>IPC Type Contracts</b><br/>(ipc-types.ts)<br/>- FixCodeRequest/Response<br/>- DetectEnvRequest/Response<br/>- OrganizeFileRequest/Response<br/>- ChatRequest/Response<br/>- HealthCheck, Cancel"]
        
        CHANNELS["IPC Channels<br/>🔴 Main Process<br/>🔵 Renderer Process<br/>Bidirectional Events"]
    end
    
    subgraph "BUSINESS LOGIC LAYER - Services"
        direction TB
        
        subgraph AI_ROUTING["AI Routing & Management"]
            AIR["<b>AI Router</b><br/>Intelligent Model Selection<br/>Error Recovery<br/>Fallback Chain Management"]
            AIS_MGR["<b>AI Settings Manager</b><br/>- Backend Config<br/>- API Keys<br/>- Model Selection<br/>- Persistence"]
            OLLAMA["<b>Ollama Client</b><br/>Local Model Support<br/>Offline Capability"]
        end
        
        subgraph FEATURE_SERVICES["Feature Business Logic"]
            CF_SVC["<b>Code Fixer Engine</b><br/>- Code Analysis<br/>- Fix Generation<br/>- Codebase Scanning<br/>- Change Tracking"]
            EB_SVC["<b>Environment Detector</b><br/>- Framework Detection<br/>- Tool Discovery<br/>- Setup Steps Generation"]
            FO_SVC["<b>File Organizer Service</b><br/>- AI Categorization<br/>- Plan Generation<br/>- Safe Execution"]
            FO_SAFE["<b>Safe File Operations</b><br/>- Atomic Operations<br/>- Rollback Metadata<br/>- Transaction Logging"]
            FO_PLAN_ADAPTER["<b>Plan Adapter</b><br/>- Legacy Format Support<br/>- Plan Normalization"]
        end
        
        subgraph CORE_SERVICES["Core System Services"]
            TEM["<b>Task Executor</b><br/>- Command Execution<br/>- Streaming Output<br/>- Process Management<br/>- Timeout Handling"]
            QM["<b>Queue Manager</b><br/>- Task Queueing<br/>- Concurrency Control<br/>- Priority Management"]
            PM["<b>Permission Manager</b><br/>- Access Control<br/>- Security Checks<br/>- Resource Protection"]
            LOG["<b>Logger Service</b><br/>- Structured Logging<br/>- Debug Tracking<br/>- Error Recording"]
            EB["<b>Event Bus</b><br/>- State Machine<br/>- Event Publishing<br/>- Event Subscription"]
        end
    end
    
    subgraph "DATA & PERSISTENCE LAYER"
        direction TB
        STATE["<b>State Management</b><br/>- UI Settings Cache<br/>- Project Paths<br/>- Panel Sizes<br/>- Last Panel"]
        STORE["<b>Local Storage</b><br/>- Browser Storage API<br/>- Config Persistence"]
        ROLLBACK["<b>Rollback Engine</b><br/>- Batch Metadata<br/>- File Snapshots<br/>- Operation Logs"]
    end
    
    subgraph "EXTERNAL INTEGRATIONS"
        direction TB
        FS["<b>File System</b><br/>- fs-extra<br/>- File Operations<br/>- Directory Scanning"]
        CLIP["<b>Clipboard</b><br/>- Copy/Paste<br/>- Code Snippets"]
        TRAY["<b>System Tray</b><br/>- App Icon<br/>- Quick Launch"]
        PROC["<b>System Process</b><br/>- Child Processes<br/>- Command Execution"]
    end
    
    subgraph "AI BACKENDS"
        direction TB
        GEMINI["<b>Google Gemini</b><br/>🌐 Cloud API<br/>Primary Model<br/>Fallback Priority 1"]
        OPENAI["<b>OpenAI GPT-4o</b><br/>🌐 Cloud API<br/>Secondary Model<br/>Fallback Priority 2"]
        OLLAMA_SVC["<b>Ollama Local</b><br/>🖥️ Local Inference<br/>Tertiary Model<br/>Fallback Priority 3<br/>Offline Support"]
    end
    
    subgraph "APPLICATION RUNTIME"
        direction TB
        ELECTRON["<b>Electron Main Process</b><br/>(main.ts)<br/>- App Initialization<br/>- Window Management<br/>- IPC Handlers<br/>- Lifecycle Management"]
        VITE["<b>Vite + React</b><br/>- Renderer Process<br/>- HMR Development<br/>- Build Optimization"]
    end
    
    %% PRESENTATION to COMMUNICATION
    APP -->|IPC Calls| PRELOAD
    MENU -->|Navigate| APP
    SHIMEJI --> MENU
    FEATURES -->|State Updates| APP
    MODALS -->|Callbacks| APP
    
    %% COMMUNICATION to BUSINESS LOGIC
    PRELOAD -->|Route IPC| CHANNELS
    CHANNELS -->|Handle Events| ELECTRON
    IPC_TYPES -->|Enforce Contracts| CHANNELS
    
    %% BUSINESS LOGIC Interconnections
    AIR -->|Select Model| AIS_MGR
    AIR -->|Fallback Chain| OLLAMA
    AIR -->|Use Local| OLLAMA_SVC
    
    CF_SVC -->|AI Processing| AIR
    EB_SVC -->|AI Processing| AIR
    FO_SVC -->|AI Processing| AIR
    FO_SVC -->|Safe Ops| FO_SAFE
    FO_SAFE -->|Plan Format| FO_PLAN_ADAPTER
    
    TEM -->|Execute| PROC
    QM -->|Queue| TEM
    LOG -->|Record| QM
    
    %% FEATURE to CORE SERVICES
    CF_SVC -->|Log Actions| LOG
    EB_SVC -->|Log Actions| LOG
    FO_SVC -->|Execute Ops| TEM
    FO_SVC -->|Persist State| STORE
    
    %% DATA LAYER
    STATE -->|Sync| STORE
    ROLLBACK -->|Recover| FO_SVC
    
    %% EXTERNAL INTEGRATIONS
    FS -->|Read/Write Files| FO_SVC
    FS -->|Scan Projects| EB_SVC
    CLIP -->|Code Input| CF_SVC
    TRAY -->|UI Control| ELECTRON
    PROC -->|Commands| TEM
    
    %% AI BACKENDS
    AIR -->|Request| GEMINI
    AIR -->|Fallback| OPENAI
    AIR -->|Offline| OLLAMA_SVC
    OLLAMA -->|Connect| OLLAMA_SVC
    
    %% ELECTRON RUNTIME
    ELECTRON -->|Manage| PRELOAD
    ELECTRON -->|Execute Services| FEATURE_SERVICES
    ELECTRON -->|Execute Services| CORE_SERVICES
    VITE -->|Render| APP
    
    %% Styling
    classDef presentation fill:#E3F2FD,stroke:#1976D2,color:#000
    classDef communication fill:#F3E5F5,stroke:#7B1FA2,color:#000
    classDef logic fill:#E8F5E9,stroke:#388E3C,color:#000
    classDef data fill:#FFF3E0,stroke:#F57C00,color:#000
    classDef external fill:#FCE4EC,stroke:#C2185B,color:#000
    classDef ai fill:#F1F8E9,stroke:#689F38,color:#000
    classDef runtime fill:#ECEFF1,stroke:#455A64,color:#000
    
    class APP,SHIMEJI,MASCOT,CONTEXT,FEATURES,CF,EB,FO,CC,DR,MODALS,MENU presentation
    class PRELOAD,IPC_TYPES,CHANNELS communication
    class AI_ROUTING,FEATURE_SERVICES,CORE_SERVICES,AIR,AIS_MGR,OLLAMA,CF_SVC,EB_SVC,FO_SVC,FO_SAFE,FO_PLAN_ADAPTER,TEM,QM,PM,LOG,EB logic
    class STATE,STORE,ROLLBACK data
    class FS,CLIP,TRAY,PROC external
    class GEMINI,OPENAI,OLLAMA_SVC,AI ai
    class ELECTRON,VITE runtime
```

---

## Key Architecture Patterns

### 1. **Layered Architecture (5-Layer Model)**
- **Presentation Layer**: React UI components with state management
- **Communication Layer**: IPC bridge with type-safe contracts
- **Business Logic Layer**: Feature services and AI routing
- **Data Layer**: State persistence and rollback mechanisms
- **Integration Layer**: External systems (File system, APIs, Process management)

### 2. **5 Core Features with Unified Architecture**

#### **Feature 1: Code Fixer** 
- **Input**: Clipboard code, file code, or full codebase
- **Processing**: Analyzes, generates fixes via AI
- **Output**: Diff preview, applies fixes, provides explanations
- **Models**: Gemini → OpenAI → Ollama fallback chain

#### **Feature 2: Environment Builder**
- **Input**: Project path selection
- **Processing**: Scans for frameworks (Node/Python/Java/Rust/Go)
- **Output**: Setup steps, missing tools, environment variables
- **Intelligence**: Framework-specific detection, platform detection

#### **Feature 3: File Organizer**
- **Input**: Folder path + organization rules (AI or custom)
- **Processing**: Categorizes files via AI, generates safe plan
- **Output**: Preview moves, applies atomically, supports rollback
- **Safety**: Transaction logging, rollback metadata, dry-run mode

#### **Feature 4: AI Chat Repo**
- **Input**: User messages + project context
- **Processing**: Understands codebase structure, provides relevant answers
- **Output**: Streaming responses, code references
- **Context**: Loads files, maintains conversation history

#### **Feature 5: Discussion Room**
- **Input**: Multi-user chat messages
- **Processing**: Socket.io based real-time sync
- **Output**: Persistent messages, room management
- **Features**: User presence, message history, collaborative space

### 3. **Multi-Model AI with Intelligent Fallback**
```
User Request → AI Router
    ├─ Try Primary: Google Gemini 2.0 Flash
    │   └─ ✓ Success → Return
    │   └─ ✗ Fail → Fallback
    ├─ Try Secondary: OpenAI GPT-4o
    │   └─ ✓ Success → Return
    │   └─ ✗ Fail → Fallback
    └─ Try Tertiary: Ollama (Local)
        └─ ✓ Success → Return
        └─ ✗ Fail → Error
```

### 4. **IPC Contract Safety**
- All requests/responses inherit from `IPCRequestBase` / `IPCResponseBase`
- RequestId tracking for async correlation
- Timeout configuration
- Standardized error handling with error codes

### 5. **Safe File Operations Pattern**
- Dry-run preview generation first
- Atomic transactions with rollback metadata
- Operation logging for debugging
- Safe executor validates before execution

---

## Data Flow Examples

### **Code Fixer Flow**
1. User enters code in UI → calls `window.electronAPI.fixCode(request)`
2. Renderer sends IPC message to main process
3. Main process routes to AI Router
4. AI Router tries Gemini → OpenAI → Ollama
5. Result streamed back via IPC
6. UI displays diff, user reviews
7. On apply: change persisted, logged, explainable

### **File Organizer Flow**
1. User selects folder → calls `window.electronAPI.organizeFile(request)`
2. Preload forwards to main process
3. Main generates AI-based organization plan
4. Plan adapter normalizes legacy format
5. Safe executor creates transaction preview
6. UI displays moves in preview mode
7. On apply: Safe executor writes changes + rollback metadata
8. On rollback: Reads metadata, restores original files

### **Environment Builder Flow**
1. User selects project → calls `window.electronAPI.detectEnv(projectPath)`
2. Task executor scans directory structure
3. Detects frameworks by package.json, requirements.txt, pom.xml, Cargo.toml
4. AI generates platform-specific setup steps
5. Queue manager manages execution
6. UI displays detection results + setup guidance
7. Optional: User triggers setup (executes commands)

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Tailwind CSS | UI rendering, styling |
| **Desktop** | Electron 33, Vite 6 | App shell, build tool |
| **IPC** | Electron IPC (preload.ts) | Process communication |
| **AI** | Gemini 2.0, OpenAI GPT-4o, Ollama | Intelligence layer |
| **State** | React Hooks, localStorage | State management |
| **File Ops** | fs-extra | Safe file operations |
| **Process** | child_process, p-queue | Task execution |
| **Real-time** | Socket.io | Discussion room sync |
| **UI Components** | Lucide icons, Motion | Icons, animations |
| **Type Safety** | TypeScript 5.8 | Compile-time safety |

---

## Key Quality Attributes

| Attribute | Implementation |
|-----------|----------------|
| **Reliability** | Fallback chain, error recovery, rollback support |
| **Safety** | IPC contracts, dry-run mode, transaction logging |
| **Performance** | Streaming responses, queue management, caching |
| **Maintainability** | Layered architecture, type safety, modular features |
| **Security** | Preload bridge, permission checks, key isolation |
| **Offline** | Ollama local support, no cloud required |
| **Extensibility** | Feature plugin pattern, AI router pluggable |

---

## Cross-Cutting Concerns

1. **Error Handling**: Structured error codes, fallback mechanisms
2. **Logging**: Centralized logger service with debug tracking
3. **Security**: Permission manager, API key isolation, safe file ops
4. **Performance**: Queue manager, timeout management, streaming
5. **State**: Persistent UI settings, project paths, panel geometry

---

## Deployment Architecture

```
┌─────────────────────────────┐
│   Source Code (TypeScript)  │
│  - main.ts                  │
│  - preload.ts               │
│  - src/                     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Build & Compile            │
│  - tsc (TS → JS)            │
│  - Vite (React build)       │
│  - Java/Maven (if needed)   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Test & Verify              │
│  - Type checking            │
│  - Feature tests            │
│  - Sample validation        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Electron Packaging         │
│  - Main + Preload JS        │
│  - Vite dist/               │
│  - Assets                   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Distribution               │
│  - Windows .exe             │
│  - macOS .dmg               │
│  - Linux AppImage           │
└─────────────────────────────┘
```

---

## Future Extensibility

The architecture supports:
- **New AI Models**: Add to fallback chain via AI Router
- **New Features**: Create feature service + IPC contracts + UI overlay
- **New AI Backends**: Implement client + integrate to router
- **Custom Workflows**: Extend task executor and queue manager
- **Plugin System**: Feature registration and dynamic loading

