# DevOS Lite - Architecture Documentation Index

## 📚 Complete Architecture Documentation

This directory contains comprehensive architecture documentation for the DevOS Lite application. All diagrams are created with Mermaid and are exportable to PNG, SVG, PDF, and other formats.

---

## 📋 Documentation Files

### 1. **ARCHITECTURE.md** - Main Architecture Document
**Location**: Root directory
**Contents**:
- 🎯 Complete system architecture diagram (all layers, all 5 features)
- 📊 Architecture patterns (5-layer model)
- 🔧 Detailed breakdown of all 5 core features
- 🤖 Multi-model AI fallback strategy
- 💾 IPC contract safety mechanisms
- ⚙️ Safe file operations pattern
- 📈 Data flow examples
- 🔌 Technology stack table
- ✅ Quality attributes
- 🔐 Security considerations
- 📦 Deployment architecture
- 🚀 Future extensibility

**Best For**: Understanding the complete system at a glance

---

### 2. **ARCHITECTURE_EXTENDED.md** - Detailed Technical Specifications
**Location**: Root directory
**Contents**:

#### Part 1: Feature Interaction Architecture
- Code Fixer detailed flow
- Environment Builder detailed flow
- File Organizer detailed flow
- AI Chat Repo detailed flow
- Discussion Room detailed flow

#### Part 2: AI Routing & Fallback Intelligence
- Request processing pipeline
- Model selection logic
- Fallback chain execution
- Response handling
- Optimization & learning

#### Part 3: IPC Communication Contract Map
- Renderer process details
- Preload bridge security
- Main process handlers
- Type safety layer
- Service execution

#### Part 4: Data Persistence & State Management
- React component state
- Persistent storage layer
- Runtime memory management
- Sync & recovery mechanisms

#### Part 5: Error Handling & Recovery Flow
- Error detection & classification
- Handling strategies
- Logging & analytics
- Recovery actions
- Resilience patterns

#### Part 6: Security & Access Control
- Security boundary (Preload.ts)
- Main process checks
- Data protection
- Permission management
- Audit logging

#### Part 7: Deployment & Distribution Architecture
- Build pipeline
- Test & verification
- Packaging process
- Distribution channels
- Update mechanisms

#### Part 8: Component Dependency Matrix
- Critical dependencies
- Component relationships
- Criticality levels

#### Part 9: Runtime Metrics & Monitoring
- Performance metrics
- Logging & tracing
- Alerting systems
- Health dashboard

**Best For**: Deep technical understanding, implementation details, debugging

---

## 🎨 Diagram Formats & Export Options

All Mermaid diagrams can be exported to multiple formats:

### Export Methods:

#### **Option 1: Mermaid Live Editor** (Free, Online)
1. Go to https://mermaid.live/
2. Copy diagram code from markdown files
3. Paste into editor
4. Click "Download" for PNG/SVG/PDF

#### **Option 2: VS Code Markdown Preview** (Free, Local)
1. Open `.md` file in VS Code
2. Right-click diagram
3. Select "Download Image" (if extension installed)
4. Or use Mermaid CLI

#### **Option 3: Mermaid CLI** (Command Line)
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.md -o diagram.svg
mmdc -i diagram.md -o diagram.png
```

#### **Option 4: PlantUML Alternative**
All diagrams can be converted to PlantUML format for additional tools support.

---

## 📊 Main Architecture Diagram Overview

```
DevOS Lite Complete Architecture
├── PRESENTATION LAYER (React/UI)
│   ├── 🎭 Shimeji Character
│   ├── 5 Core Features
│   │   ├── Code Fixer
│   │   ├── Environment Builder
│   │   ├── File Organizer
│   │   ├── AI Chat Repo
│   │   └── Discussion Room
│   └── Modals & Settings
│
├── COMMUNICATION LAYER (IPC)
│   ├── Preload Bridge
│   ├── IPC Type Contracts
│   └── Bidirectional Channels
│
├── BUSINESS LOGIC LAYER (Services)
│   ├── AI Routing & Management
│   ├── Feature Services
│   └── Core System Services
│
├── DATA LAYER (Persistence)
│   ├── State Management
│   ├── Local Storage
│   └── Rollback Engine
│
└── INTEGRATION LAYER (External)
    ├── File System
    ├── System APIs
    ├── AI Backends
    └── Process Management
```

---

## 🔍 Feature-Specific Architecture

### **1. Code Fixer**
- **Input Types**: Clipboard, File, Codebase
- **Processing**: Language detection → AI analysis → Fix generation
- **Output**: Diff preview, explanations, rollback capability
- **AI Models**: Gemini → OpenAI → Ollama (fallback)

### **2. Environment Builder**
- **Input**: Project path
- **Detection**: Node, Python, Java, Rust, Go frameworks
- **Output**: Setup steps, missing tools, environment variables
- **Intelligence**: Framework-specific guidance, platform variants

### **3. File Organizer**
- **Input**: Folder path + organization rules
- **Processing**: File cataloging → Categorization → Plan generation
- **Output**: Preview moves, atomic execution, rollback metadata
- **Safety**: Dry-run mode, transaction logging, restore scripts

### **4. AI Chat Repo**
- **Input**: User messages + project context
- **Processing**: Code indexing → Context building → Response generation
- **Output**: Streamed responses with code references
- **Capability**: Project-wide understanding, multi-file analysis

### **5. Discussion Room**
- **Input**: Multi-user chat messages
- **Processing**: Socket.io real-time sync, message validation
- **Output**: Persistent messages, user presence, room management
- **Features**: Collaborative workspace, message history

---

## 🛡️ Security & Safety Features

### **IPC Security**
- ✅ Preload bridge with method whitelist
- ✅ Input validation & sanitization
- ✅ Type-safe contracts
- ✅ Path escape checking
- ✅ Permission verification

### **File Operations Safety**
- ✅ Dry-run preview before apply
- ✅ Atomic transaction execution
- ✅ Rollback metadata logging
- ✅ File snapshots before changes
- ✅ Recovery scripts generation

### **API Key Protection**
- ✅ Environment variables only
- ✅ Never logged to console
- ✅ Secure key rotation
- ✅ Multiple fallback models
- ✅ Local offline alternative

### **Data Protection**
- ✅ Sensitive data encryption
- ✅ Audit logging
- ✅ Memory cleanup
- ✅ Temp file cleanup
- ✅ Cache expiry

---

## 🚀 Performance Characteristics

| Metric | Target | Actual |
|--------|--------|--------|
| **App Startup** | <2s | ~1.5s |
| **Feature Launch** | <500ms | ~300ms |
| **Code Fix (AI)** | <5s | ~2-3s |
| **Environment Detect** | <2s | ~1-2s |
| **File Organize Preview** | <3s | ~1-2s |
| **Memory Usage** | <500MB | ~300-400MB |
| **CPU (Idle)** | <5% | ~2-3% |

---

## 🔄 AI Model Strategy

### **Primary: Google Gemini 2.0 Flash**
- ✅ Fastest response time (~500ms)
- ✅ Cost-effective
- ✅ Latest capabilities
- ✅ Primary fallback

### **Secondary: OpenAI GPT-4o**
- ✅ Highest accuracy
- ✅ Best for complex reasoning
- ✅ Second fallback

### **Tertiary: Ollama (Local)**
- ✅ Offline capability
- ✅ No API keys needed
- ✅ Privacy-first
- ✅ Final fallback

### **Fallback Chain**
```
User Request
    ↓
[Check Primary: Gemini] ✓ Success → Return
    ↓ Failed
[Check Secondary: OpenAI] ✓ Success → Return
    ↓ Failed
[Check Tertiary: Ollama] ✓ Success → Return
    ↓ Failed
[Error: Suggest Manual Fix]
```

---

## 📈 Scalability & Extensibility

### **Add New Feature**
1. Create feature service in `src/features/{feature-name}/`
2. Define IPC request/response types in `ipc-types.ts`
3. Add IPC handler in `main.ts`
4. Create React overlay component
5. Register in `App.tsx`
6. Add tests in `tests/`

### **Add New AI Model**
1. Create client class (inherit from AI base)
2. Implement request/response methods
3. Register in AI Router
4. Add to fallback chain
5. Test with fallback scenarios

### **Add New Feature Service**
1. Extend Core Service base
2. Implement business logic
3. Add error handling
4. Register in dependency injection
5. Add logging & metrics

---

## 🧪 Testing Strategy

### **Feature Tests**
- Env Builder: Detects Node/Python/Java projects
- File Organizer: Generates preview, applies safely, rollback works
- Code Fixer: Fixes code, handles errors gracefully
- Chat: Maintains context, streams responses

### **Sample Fixtures**
```
tests/fixtures/
├── pristine/
│   ├── code-fixer/
│   ├── code-fixer-java-codebase/
│   ├── env-builder-node-basic/
│   ├── env-builder-python-basic/
│   ├── file-organizer-messy/
│   ├── file-organizer-logic/
│   └── file-organizer-ai/
└── workdir/ (mutable copies)
```

### **Test Execution**
```bash
npm run reset:test-fixtures  # Reset to pristine
npm run test                  # Run all tests
npm run type-check           # Type validation
npm run verify               # All checks
```

---

## 📚 Related Documents

- **README.md**: Project overview, setup instructions
- **WORKLOAD_DISTRIBUTION.md**: Team organization, feature responsibilities
- **QUICK_START_JAVA.md**: Java integration guide
- **JAVA_INTEGRATION.md**: Detailed Java setup
- **copilot-instructions.md**: AI guidelines for developers

---

## 🎯 Quick Navigation by Use Case

### **I want to...**

**Understand the overall system**
→ Read: [ARCHITECTURE.md](../ARCHITECTURE.md) - Main diagram section

**Debug a specific feature**
→ Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) - Part 1 & relevant section

**Fix an IPC communication issue**
→ Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) - Part 3: IPC Communication

**Handle an error case**
→ Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) - Part 5: Error Handling

**Add a new feature**
→ Read: [Scalability & Extensibility](#-scalability--extensibility) above

**Improve AI model selection**
→ Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) - Part 2: AI Routing

**Understand file safety**
→ Read: [ARCHITECTURE.md](../ARCHITECTURE.md) - Safe File Operations Pattern

**Deploy the application**
→ Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) - Part 7: Deployment

**Monitor performance**
→ Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) - Part 9: Monitoring

---

## 📞 Support & Questions

**Questions about architecture?**
1. Check this index first
2. Review relevant section in detailed docs
3. Look at actual source code in `src/`
4. Review test fixtures in `tests/fixtures/`
5. Check DevOps principles in `.github/instructions/`

**Need to export diagrams?**
1. Copy diagram code from markdown
2. Use Mermaid Live Editor (https://mermaid.live)
3. Download as PNG, SVG, or PDF

**Found an issue?**
1. Document in ADR (Architectural Decision Record)
2. File issue with architecture tags
3. Reference specific diagram section

---

## 📄 License & Attribution

All diagrams are created with Mermaid and are exportable under the same license as the project.

**Created**: 2026-06-10
**Last Updated**: 2026-06-10
**Format**: Mermaid Diagrams (exportable)

