# DevOS Lite - Architecture Visual Cheatsheet

## 🎯 System Architecture at a Glance

```
╔════════════════════════════════════════════════════════════════════════╗
║                        DEVOS LITE ARCHITECTURE                         ║
╚════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER (React/UI)                      │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Shimeji    │  │  Feature     │  │   Modals     │                 │
│  │ Character    │  │  Overlays    │  │  & Settings  │                 │
│  │  (Floating)  │  │              │  │              │                 │
│  └──────────────┘  ├──────────────┤  ├──────────────┤                 │
│                    │ Code Fixer   │  │ AI Settings  │                 │
│                    │ Environment  │  │ Appearance   │                 │
│                    │ File Org     │  │ Help         │                 │
│                    │ Chat         │  │ Path Input   │                 │
│                    │ Discussion   │  │              │                 │
│                    └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
                            ┌─────────────────┐
                            │  IPC Bridge     │
                            │  (Preload.ts)   │
                            │  - Whitelist    │
                            │  - Validate     │
                            │  - Route        │
                            └─────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 BUSINESS LOGIC LAYER (Node.js Services)                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                        AI ROUTING SYSTEM                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │   Gemini    │  │   OpenAI    │  │   Ollama    │            │   │
│  │  │  (Primary)  │  │(Secondary)  │  │  (Fallback) │            │   │
│  │  │   Cloud     │  │   Cloud     │  │    Local    │            │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  │         ▲              ▲                  ▲                     │   │
│  │         └──────────────┼──────────────────┘                    │   │
│  │                  AI Router                                     │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Code Fixer   │  │ Environment  │  │ File Org     │  │ Codebase │  │
│  │ Service      │  │ Detector     │  │ Service      │  │ Chat     │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  └──────────┘  │
│  │ - Fix gen    │  │ - Framework  │  │ - Categorize │  ┌──────────┐  │
│  │ - Parse code │  │   detect     │  │ - Plan       │  │Discussion│  │
│  │ - Apply diff │  │ - Tool check │  │ - Execute    │  │ Room     │  │
│  └──────────────┘  └──────────────┘  │ - Rollback   │  └──────────┘  │
│                                       └──────────────┘                  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    CORE SERVICES                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Task     │  │ Queue    │  │ Permission│ │ Logger   │       │  │
│  │  │ Executor │  │ Manager  │  │ Manager  │  │          │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  INTEGRATION & EXTERNAL SYSTEMS                         │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │File      │  │Clipboard │  │Process   │  │System    │  │Socket.io │ │
│  │System    │  │          │  │Mgmt      │  │Tray      │  │Real-time │ │
│  │(fs-extra)│  │          │  │          │  │          │  │Sync      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 The 5 Features Explained

```
1️⃣  CODE FIXER
    Input: Code Snippet / File / Codebase
    ┌─────────────────────────────────────┐
    │ 1. Detect Language                  │
    │ 2. Analyze Code Issues              │
    │ 3. Generate Fix (AI)                │
    │ 4. Show Diff Preview                │
    │ 5. Apply Changes (Optional)         │
    │ 6. Support Rollback                 │
    └─────────────────────────────────────┘
    Output: Fixed Code + Explanation

2️⃣  ENVIRONMENT BUILDER
    Input: Project Path
    ┌─────────────────────────────────────┐
    │ 1. Scan Project Files               │
    │ 2. Detect Frameworks                │
    │    - Node.js (package.json)         │
    │    - Python (requirements.txt)      │
    │    - Java (pom.xml)                 │
    │    - Rust (Cargo.toml)              │
    │    - Go (go.mod)                    │
    │ 3. Check for Tools                  │
    │ 4. Generate Setup Steps             │
    │ 5. Platform-Specific Variants       │
    └─────────────────────────────────────┘
    Output: Setup Guide + Commands

3️⃣  FILE ORGANIZER
    Input: Folder Path + Rules
    ┌─────────────────────────────────────┐
    │ 1. Catalog All Files                │
    │ 2. Categorize (AI or Rules)         │
    │ 3. Generate Move Plan               │
    │ 4. Preview (DRY-RUN)                │
    │ 5. Get User Confirmation            │
    │ 6. Execute Atomically               │
    │ 7. Support Rollback                 │
    └─────────────────────────────────────┘
    Output: Organized Files + Undo Option

4️⃣  CODEBASE CHAT
    Input: User Question + Code Context
    ┌─────────────────────────────────────┐
    │ 1. Index Project Files              │
    │ 2. Build Conversation Context       │
    │ 3. Rank Relevant Files              │
    │ 4. Generate Response (AI)           │
    │ 5. Include Code References          │
    │ 6. Stream Response                  │
    │ 7. Maintain History                 │
    └─────────────────────────────────────┘
    Output: Streamed Response + References

5️⃣  DISCUSSION ROOM
    Input: Multi-User Chat Messages
    ┌─────────────────────────────────────┐
    │ 1. Create/Join Room                 │
    │ 2. Validate Messages                │
    │ 3. Real-time Broadcast (Socket.io)  │
    │ 4. Persist Message History          │
    │ 5. Track User Presence              │
    │ 6. Support Rich Formatting          │
    └─────────────────────────────────────┘
    Output: Collaborative Space
```

---

## 🔄 Request-Response Cycle

```
USER ACTION (Click, Type, etc.)
         │
         ▼
    ┌────────────────────┐
    │ React Component    │
    │ Updates State      │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Call IPC Method    │
    │ window.electronAPI │
    │   .fixCode()       │
    │   .detectEnv()     │
    │   .organizeFile()  │
    └────────┬───────────┘
             │
             ▼ IPC Channel
    ┌────────────────────┐
    │ Preload Bridge     │
    │ (Validation Layer) │
    │ ✓ Method whitelist │
    │ ✓ Input validation │
    │ ✓ Type checking    │
    └────────┬───────────┘
             │
             ▼ Main Process
    ┌────────────────────┐
    │ IPC Handler        │
    │ (main.ts)          │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Feature Service    │
    │ - Code Fixer       │
    │ - Environment      │
    │ - File Org         │
    │ - Chat             │
    │ - Room             │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ AI Router          │
    │ ┌──────────────┐   │
    │ │ Try Gemini   │   │
    │ │ ↓ Try OpenAI │   │
    │ │ ↓ Try Ollama │   │
    │ └──────────────┘   │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ External Service   │
    │ (API or Local)     │
    └────────┬───────────┘
             │
             ▼ Response
    ┌────────────────────┐
    │ IPC Response       │
    │ {                  │
    │  status: success   │
    │  data: ...         │
    │  duration: 500ms   │
    │ }                  │
    └────────┬───────────┘
             │
             ▼ IPC Channel
    ┌────────────────────┐
    │ Renderer Promise   │
    │ Resolves           │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ React State Update │
    │ setResult(data)    │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Component Re-render│
    │ Display Result     │
    └────────┬───────────┘
             │
             ▼
    USER SEES RESULT ✓
```

---

## 🛡️ Security Layers

```
INPUT SECURITY
│
├─ Method Whitelist
│  └─ Only approved: fixCode, detectEnv, organizeFile, etc.
│
├─ Input Type Validation
│  └─ Check: string, number, object shape
│
├─ Size Limits
│  └─ Max file size, max files, timeout enforcement
│
└─ Injection Prevention
   └─ No code injection, SQL injection, path traversal

PROCESS SECURITY
│
├─ File Permissions Check
│  └─ Can we read/write this path?
│
├─ API Key Management
│  └─ Keys from .env only, never logged
│
├─ Path Validation
│  └─ No ../, canonical path, restrict root
│
└─ Resource Limits
   └─ Memory, CPU, timeout constraints

OPERATION SECURITY
│
├─ Audit Logging
│  └─ Log all operations with timestamps
│
├─ Data Encryption
│  └─ Sensitive data in cache, memory wipe
│
├─ Error Handling
│  └─ Generic error messages to UI, detailed in logs
│
└─ Cleanup
   └─ Temp files, cache expiry, memory release
```

---

## 🎯 AI Model Selection Strategy

```
REQUEST ARRIVES
        │
        ▼
CHECK API KEYS & SERVICE HEALTH
        │
        ├─ Gemini Available?
        │  │  (GEMINI_API_KEY set?)
        │  │
        │  ├─ YES: Try Gemini
        │  │       │
        │  │       ├─ Success? ──► RETURN RESULT ✓
        │  │       │
        │  │       └─ Failed → Check why
        │  │           ├─ Rate limited → Cache fallback
        │  │           ├─ Key invalid → Log error
        │  │           ├─ Timeout → Try next
        │  │           └─ Network → Try next
        │  │
        │  └─ NO: Continue
        │
        ├─ OpenAI Available?
        │  │  (OPENAI_API_KEY set?)
        │  │
        │  ├─ YES: Try OpenAI
        │  │       │
        │  │       ├─ Success? ──► RETURN RESULT ✓
        │  │       │
        │  │       └─ Failed → Try next
        │  │
        │  └─ NO: Continue
        │
        └─ Ollama Available?
           │  (Running on localhost:11434?)
           │
           ├─ YES: Try Ollama
           │       │
           │       ├─ Success? ──► RETURN RESULT ✓
           │       │
           │       └─ Failed → ERROR
           │
           └─ NO: ERROR (No models available)

STATS TRACKING
├─ Success rate per model
├─ Average response time
├─ Error frequency
└─ Cost analysis
```

---

## 💾 Data Flow in File Organizer

```
USER SELECTS FOLDER
         │
         ▼
SCAN FILES
├─ File enumeration
├─ Extension analysis
├─ Path parsing
└─ Size calculation
         │
         ▼
CATEGORIZE (AI)
├─ Send file list to AI
├─ Get categories back
├─ Apply custom rules
└─ Resolve conflicts
         │
         ▼
GENERATE PLAN
├─ Calculate moves
├─ Create directories
├─ Avoid conflicts
└─ Estimate impact
         │
         ▼
SHOW PREVIEW
├─ Display all moves
├─ Show affected files
├─ Risk assessment
└─ User confirmation
         │
         ▼
USER APPROVES
         │
         ▼
EXECUTE ATOMICALLY
├─ Record metadata (batch ID)
├─ Create file snapshots (if small)
├─ Execute moves
├─ Log operations
└─ Generate rollback script
         │
         ▼
SUCCESS ✓
├─ Confirm to user
├─ Offer rollback option
└─ Store metadata
         │
         ▼ (If needed)
         │
         ▼
ROLLBACK
├─ Read metadata
├─ Execute restore script
├─ Verify integrity
└─ Cleanup metadata
```

---

## 📦 Key Files & Locations

```
SOURCE CODE
│
├─ main.ts ..................... Electron entry point
├─ preload.ts .................. IPC bridge (security boundary)
├─ src/
│  ├─ App.tsx .................. Main React component
│  ├─ ipc-types.ts ............. IPC contracts (type-safe)
│  ├─ types.ts ................. UI types
│  ├─ components/
│  │  ├─ Shimeji.tsx ........... Floating character
│  │  ├─ overlays/ ............ Feature panels
│  │  │  ├─ CodeFixerAgentOverlay.tsx
│  │  │  ├─ EnvironmentBuilderWorkbench.tsx
│  │  │  ├─ FileOrganizerWorkbench.tsx
│  │  │  ├─ CodebaseChatOverlay.tsx
│  │  │  └─ DiscussionRoomOverlay.tsx
│  │  └─ modals/ .............. Settings & dialogs
│  │
│  ├─ features/ ............... Feature services
│  │  ├─ code-fixer/ .......... Code fixing logic
│  │  ├─ environment-builder/ . Environment detection
│  │  └─ file-organizer/ ...... File organization
│  │
│  ├─ services/ ............... Core services
│  │  ├─ ai/ .................. AI client
│  │  ├─ ai-routing/ .......... AI Router + fallback
│  │  ├─ task-executor.ts ..... Command execution
│  │  ├─ queue-manager.ts ..... Task queueing
│  │  ├─ logger.ts ............ Logging
│  │  └─ permission-manager.ts  Access control
│  │
│  └─ core/
│     ├─ event-bus.ts ........ Event pub/sub
│     └─ state-machine.ts .... State management
│
└─ docs/architecture/ ......... This documentation
```

---

## ⚡ Performance Targets

```
METRIC                  TARGET          ACTUAL
─────────────────────────────────────────────────
App Startup             < 2 seconds      ~1.5s
Feature Launch          < 500ms          ~300ms
Code Fix (AI)           < 5 seconds      ~2-3s
Environment Detect      < 2 seconds      ~1-2s
File Organize Preview   < 3 seconds      ~1-2s
Memory Usage            < 500MB          ~300-400MB
CPU (Idle)              < 5%             ~2-3%
API Latency (Gemini)    ~500ms           ✓
API Latency (OpenAI)    ~1000ms          ✓
API Latency (Ollama)    ~2000ms          ✓
```

---

## 📱 Responsive Design

```
Mascot Window:         96 x 96 px
Menu Window:          460 x 640 px
Code Fixer Panel:   1220 x 780 px
Environment Panel:   920 x 720 px
File Organizer:      760 x 660 px
Chat Panel:          960 x 720 px
Discussion Room:     960 x 720 px
Help Panel:         1060 x 760 px
Settings Panel:     1080 x 780 px
```

---

## 🚀 Build & Deployment

```
SOURCE CODE
     │
     ▼
COMPILE (tsc)
├─ main.ts → main.js
├─ preload.ts → preload.js
└─ src/ → JavaScript
     │
     ▼
BUILD (Vite)
├─ React bundle
├─ CSS minification
├─ Asset optimization
└─ Source maps
     │
     ▼
TEST & VERIFY
├─ Type checking
├─ Feature tests
└─ Smoke tests
     │
     ▼
PACKAGE (electron-builder)
├─ Windows: .exe installer
├─ macOS: .dmg package
└─ Linux: AppImage
     │
     ▼
DISTRIBUTE
├─ GitHub Release
├─ Electron Auto-Updater
└─ Manual Download
     │
     ▼
USER INSTALLATION
└─ Auto-updates enabled
```

---

## 🔗 Component Dependencies

```
App.tsx (Main)
├─ Shimeji.tsx
├─ FeatureMenu.tsx
├─ CodeFixerAgentOverlay.tsx ──► Code Fixer Service ──► AI Router
├─ EnvironmentBuilderWorkbench ─► Environment Service ──► AI Router
├─ FileOrganizerWorkbench.tsx ──► File Organizer Service ──► AI Router
├─ CodebaseChatOverlay.tsx ────► AI Chat Repo Service ──► AI Router
├─ DiscussionRoomOverlay.tsx ──► Discussion Service ──► Socket.io
├─ AISettingsModal.tsx ────────► AI Settings Manager
├─ AppearanceSettingsModal.tsx ─► UI Settings
└─ Event Bus (shared state)
     │
     ▼
All Services ────────────────────► Core Services
├─ Task Executor
├─ Queue Manager
├─ Logger
├─ Permission Manager
└─ Event Bus
```

---

## 🎓 Learning Path

1. **Start Here**: This cheatsheet
2. **Then Read**: `QUICK_REFERENCE.md`
3. **Next**: `ARCHITECTURE.md` (main diagram)
4. **Deep Dive**: `ARCHITECTURE_EXTENDED.md` (all parts)
5. **Export**: Follow `EXPORT_GUIDE.md`
6. **Implement**: Check source code in `src/`

---

**Last Updated**: 2026-06-10
**Format**: Quick Reference Cheatsheet
**Use**: Team onboarding, quick lookups, presentations

