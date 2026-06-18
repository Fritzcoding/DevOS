# DevOS Lite - Detailed System Architecture (Extended)

## Part 1: Detailed Feature Interaction Architecture

```mermaid
graph LR
    subgraph "FEATURE ORCHESTRATION"
        direction LR
        
        subgraph CF_DETAIL["Code Fixer - Detailed Flow"]
            CF_IN["Input Handler<br/>- Clipboard<br/>- File<br/>- Codebase"]
            CF_PARSE["Code Parser<br/>- Language Detection<br/>- Syntax Validation"]
            CF_AI["AI Fix Generator<br/>- Problem Analysis<br/>- Fix Generation<br/>- Explanation"]
            CF_APPLY["Apply Engine<br/>- Diff Preview<br/>- Atomic Apply<br/>- Rollback Support"]
        end
        
        subgraph EB_DETAIL["Environment Builder - Detailed Flow"]
            EB_SCAN["Project Scanner<br/>- File Discovery<br/>- Pattern Matching<br/>- Size Optimization"]
            EB_DETECT["Framework Detector<br/>- package.json→Node<br/>- requirements.txt→Python<br/>- pom.xml→Java<br/>- Cargo.toml→Rust<br/>- go.mod→Go"]
            EB_PLAN["Setup Planner<br/>- Tool Detection<br/>- Version Check<br/>- Step Generation<br/>- Platform Variant"]
        end
        
        subgraph FO_DETAIL["File Organizer - Detailed Flow"]
            FO_CATALOG["File Cataloging<br/>- Extension Analysis<br/>- Path Parsing<br/>- Size Calculation"]
            FO_CATEGORIZE["Categorization Engine<br/>- AI Categorization<br/>- Rule Matching<br/>- Custom Rules"]
            FO_PLAN["Organization Planner<br/>- Move Generation<br/>- Dir Creation<br/>- Conflict Detection"]
            FO_EXECUTE["Safe Executor<br/>- Dry-run Preview<br/>- Atomic Execution<br/>- Rollback Metadata"]
        end
        
        subgraph CC_DETAIL["Codebase Chat - Detailed Flow"]
            CC_INDEX["Code Indexing<br/>- File Enumeration<br/>- Structure Analysis<br/>- Symbol Extraction"]
            CC_CONTEXT["Context Builder<br/>- Query Understanding<br/>- File Selection<br/>- Relevance Ranking"]
            CC_RESPOND["Response Generator<br/>- Code References<br/>- Explanation<br/>- Streaming Output"]
        end
        
        subgraph DR_DETAIL["Discussion Room - Detailed Flow"]
            DR_SESSION["Session Manager<br/>- Room Creation<br/>- User Management<br/>- State Sync"]
            DR_MESSAGE["Message Pipeline<br/>- Message Validation<br/>- Timestamp<br/>- User Context"]
            DR_SYNC["Real-time Sync<br/>- Socket.io Broadcast<br/>- History Store<br/>- User Presence"]
        end
    end
    
    CF_IN → CF_PARSE → CF_AI → CF_APPLY
    EB_SCAN → EB_DETECT → EB_PLAN
    FO_CATALOG → FO_CATEGORIZE → FO_PLAN → FO_EXECUTE
    CC_INDEX → CC_CONTEXT → CC_RESPOND
    DR_SESSION → DR_MESSAGE → DR_SYNC
    
    classDef cfeatdetail fill:#BBDEFB,stroke:#1565C0,color:#000
    classDef ebfeatdetail fill:#C8E6C9,stroke:#2E7D32,color:#000
    classDef fofeatdetail fill:#FFE0B2,stroke:#E65100,color:#000
    classDef ccfeatdetail fill:#F8BBD0,stroke:#C2185B,color:#000
    classDef drfeatdetail fill:#E1BEE7,stroke:#6A1B9A,color:#000
    
    class CF_DETAIL,CF_IN,CF_PARSE,CF_AI,CF_APPLY cfeatdetail
    class EB_DETAIL,EB_SCAN,EB_DETECT,EB_PLAN ebfeatdetail
    class FO_DETAIL,FO_CATALOG,FO_CATEGORIZE,FO_PLAN,FO_EXECUTE fofeatdetail
    class CC_DETAIL,CC_INDEX,CC_CONTEXT,CC_RESPOND ccfeatdetail
    class DR_DETAIL,DR_SESSION,DR_MESSAGE,DR_SYNC drfeatdetail
```

---

## Part 2: AI Routing & Fallback Intelligence

```mermaid
graph TB
    subgraph "AI REQUEST PROCESSING PIPELINE"
        direction TB
        
        REQ["User Request<br/>- Code Fix<br/>- Plan Generation<br/>- Chat Response"]
        
        subgraph ROUTER["AI Router Decision Engine"]
            STATUS_CHECK["Check Backend Status<br/>- API Keys Present?<br/>- Service Healthy?<br/>- Rate Limit Status?"]
            STATS["Model Statistics<br/>- Success Rate<br/>- Avg Response Time<br/>- Last Error"]
            SELECT["Model Selection<br/>- Primary: Gemini<br/>- Secondary: OpenAI<br/>- Fallback: Ollama"]
        end
        
        subgraph EXEC["Execution Phase"]
            TRY1["Try Model 1<br/>Timeout: 30s<br/>Retry: 1"]
            RESULT1{Success?}
            TRY2["Try Model 2<br/>Timeout: 30s<br/>Retry: 1"]
            RESULT2{Success?}
            TRY3["Try Model 3<br/>Timeout: 30s<br/>No Retry"]
            RESULT3{Success?}
        end
        
        subgraph RESPONSE["Response Handling"]
            SUCCESS["✓ Success<br/>- Return Result<br/>- Update Stats<br/>- Log Duration"]
            PARTIAL["⚠ Partial<br/>- Return Partial<br/>- Mark Incomplete"]
            FALLBACK["→ Fallback<br/>- Update Error Log<br/>- Try Next"]
            FAIL["✗ Failure<br/>- Return Error<br/>- Suggest Manual"]
        end
        
        subgraph OPTIMIZE["Optimization & Learning"]
            CACHE["Response Cache<br/>- Hash Input<br/>- Cache Duration: 1h"]
            METRICS["Track Metrics<br/>- Success Rate<br/>- Token Usage<br/>- Cost Analysis"]
            FEEDBACK["User Feedback<br/>- Satisfaction<br/>- Model Preference"]
        end
    end
    
    REQ → STATUS_CHECK
    STATUS_CHECK → STATS
    STATS → SELECT
    SELECT → TRY1
    TRY1 → RESULT1
    RESULT1 -->|✓| SUCCESS
    RESULT1 -->|✗| FALLBACK
    FALLBACK → TRY2
    TRY2 → RESULT2
    RESULT2 -->|✓| SUCCESS
    RESULT2 -->|✗| FALLBACK
    FALLBACK → TRY3
    TRY3 → RESULT3
    RESULT3 -->|✓| SUCCESS
    RESULT3 -->|✗| FAIL
    
    SUCCESS → CACHE
    SUCCESS → METRICS
    PARTIAL → METRICS
    FAIL → FEEDBACK
    
    CACHE --> OUTPUT["📤 Response to UI"]
    METRICS --> OUTPUT
    FEEDBACK --> OUTPUT
    
    classDef router fill:#FFF9C4,stroke:#F57F17,color:#000,stroke-width:2px
    classDef exec fill:#E0F2F1,stroke:#00796B,color:#000,stroke-width:2px
    classDef response fill:#F1F8E9,stroke:#558B2F,color:#000,stroke-width:2px
    classDef optimize fill:#FCE4EC,stroke:#AD1457,color:#000,stroke-width:2px
    classDef decision fill:#FFE082,stroke:#F57C00,color:#000,stroke-width:2px
    
    class ROUTER,STATUS_CHECK,STATS,SELECT router
    class EXEC,TRY1,TRY2,TRY3 exec
    class RESPONSE,SUCCESS,PARTIAL,FALLBACK,FAIL response
    class OPTIMIZE,CACHE,METRICS,FEEDBACK optimize
    class RESULT1,RESULT2,RESULT3 decision
```

---

## Part 3: IPC Communication Contract Map

```mermaid
graph TB
    subgraph "IPC CHANNEL CONTRACTS & SAFETY"
        direction TB
        
        subgraph RENDERER["🔵 Renderer Process (UI/React)"]
            UI["User Interaction"]
            UI_STATE["UI State"]
            CALL["window.electronAPI.method()"]
        end
        
        subgraph PRELOAD["Preload Bridge<br/>(Security Boundary)"]
            direction TB
            EXPOSE["Exposed Methods<br/>- fixCode<br/>- detectEnv<br/>- organizeFile<br/>- chatMessage<br/>- roomMessage"]
            VALIDATE["Input Validation<br/>- Type Check<br/>- Size Limit<br/>- Sanitize"]
            INVOKE["IPC.invoke()"]
        end
        
        subgraph MAIN["🔴 Main Process (Node.js + Electron)"]
            HANDLER["IPC Handler<br/>ipcMain.handle()"]
            ROUTE["Service Router<br/>Match Channel"]
            BUSINESS["Business Logic<br/>Service Execution"]
            RESPOND["Response Builder<br/>Success/Error"]
        end
        
        subgraph TYPES["Type Safety Layer"]
            REQUEST["Request Types<br/>- IPCRequestBase<br/>- requestId<br/>- timestamp<br/>- timeout"]
            RESPONSE["Response Types<br/>- IPCResponseBase<br/>- status<br/>- duration<br/>- error?"]
            VERIFY["Type Verification<br/>- Compile-time<br/>- Runtime Validation"]
        end
        
        subgraph SERVICES["Service Execution"]
            FEATURE_LOGIC["Feature Services"]
            EXTERNAL_API["External APIs"]
            FILE_OPS["File Operations"]
        end
    end
    
    UI -->|Calls| CALL
    CALL -->|Serialize| PRELOAD
    EXPOSE -->|Validate Input| VALIDATE
    VALIDATE -->|Type Check| VERIFY
    VERIFY --> INVOKE
    INVOKE -->|IPC Message| HANDLER
    HANDLER --> ROUTE
    ROUTE --> BUSINESS
    BUSINESS -->|Execute| FEATURE_LOGIC
    FEATURE_LOGIC -->|External Call| EXTERNAL_API
    FEATURE_LOGIC -->|File I/O| FILE_OPS
    BUSINESS --> RESPOND
    RESPOND -->|Serialize| RESPONSE
    RESPONSE -->|Verify Type| VERIFY
    RESPOND -->|IPC Reply| PRELOAD
    PRELOAD -->|Promise Resolve| CALL
    CALL -->|Update| UI_STATE
    UI_STATE -->|Render| UI
    
    classDef renderer fill:#BBDEFB,stroke:#1565C0,color:#000,stroke-width:2px
    classDef preload fill:#B39DDB,stroke:#512DA8,color:#fff,stroke-width:2px
    classDef main fill:#A5D6A7,stroke:#2E7D32,color:#000,stroke-width:2px
    classDef types fill:#FFE0B2,stroke:#E65100,color:#000,stroke-width:2px
    classDef services fill:#F8BBD0,stroke:#C2185B,color:#000,stroke-width:2px
    
    class RENDERER,UI,UI_STATE,CALL renderer
    class PRELOAD,EXPOSE,VALIDATE,INVOKE preload
    class MAIN,HANDLER,ROUTE,BUSINESS,RESPOND main
    class TYPES,REQUEST,RESPONSE,VERIFY types
    class SERVICES,FEATURE_LOGIC,EXTERNAL_API,FILE_OPS services
```

---

## Part 4: Data Persistence & State Management

```mermaid
graph TB
    subgraph "STATE & PERSISTENCE ARCHITECTURE"
        direction TB
        
        subgraph UI_STATE["React Component State"]
            MENU_STATE["Menu State<br/>- Open/Close<br/>- Selected Feature"]
            MODAL_STATE["Modal State<br/>- AI Settings<br/>- Help<br/>- Path Input"]
            PANEL_STATE["Panel State<br/>- Size<br/>- Position<br/>- Last Used"]
            FEATURE_STATE["Feature State<br/>- Project Path<br/>- Results<br/>- Errors"]
        end
        
        subgraph STORAGE["Persistent Storage Layer"]
            LOCAL_STORAGE["Browser localStorage<br/>- Panel Sizes<br/>- UI Settings<br/>- Project Paths<br/>- Theme"]
            FILE_CACHE["File Cache<br/>- AI Responses<br/>- Project Scans<br/>- Setup Plans<br/>Cache TTL: 1h"]
            ROLLBACK_DB["Rollback Metadata<br/>- Batch ID<br/>- File Snapshots<br/>- Operation Log<br/>- Restore Scripts"]
        end
        
        subgraph MEMORY["Runtime Memory"]
            CACHE["Response Cache<br/>- Hash → Result<br/>- Expiry TTL<br/>- LRU Eviction"]
            QUEUE["Task Queue<br/>- Pending Tasks<br/>- Running Tasks<br/>- Results"]
            STATS["Telemetry<br/>- Model Performance<br/>- Feature Usage<br/>- Error Rates"]
        end
        
        subgraph SYNC["Sync & Recovery"]
            LOAD["On Startup<br/>1. Load localStorage<br/>2. Load cached files<br/>3. Initialize state"]
            SAVE["On Change<br/>1. Update React state<br/>2. Debounce save<br/>3. Write storage"]
            RECOVER["On Crash<br/>1. Detect rollback metadata<br/>2. Offer restore<br/>3. Clear cache"]
        end
    end
    
    UI_STATE -->|Read| LOCAL_STORAGE
    UI_STATE -->|Write| FILE_CACHE
    UI_STATE -->|Query| CACHE
    
    FEATURE_STATE -->|Persist| LOCAL_STORAGE
    MODAL_STATE -->|Save Size| LOCAL_STORAGE
    PANEL_STATE -->|Save Geometry| LOCAL_STORAGE
    
    LOCAL_STORAGE -->|Supply| LOAD
    FILE_CACHE -->|Supply| LOAD
    ROLLBACK_DB -->|Supply| RECOVER
    
    LOAD -->|Initialize| UI_STATE
    SAVE -->|Debounced Write| LOCAL_STORAGE
    SAVE -->|Write Cache| FILE_CACHE
    
    RECOVER -->|Restore Files| ROLLBACK_DB
    RECOVER -->|Clear Cache| CACHE
    RECOVER -->|Reinit| UI_STATE
    
    classDef uistate fill:#E8EAF6,stroke:#3F51B5,color:#000
    classDef storage fill:#E0F2F1,stroke:#009688,color:#000
    classDef memory fill:#FFF3E0,stroke:#FF6F00,color:#000
    classDef sync fill:#FCEAE6,stroke:#D84315,color:#000
    
    class UI_STATE,MENU_STATE,MODAL_STATE,PANEL_STATE,FEATURE_STATE uistate
    class STORAGE,LOCAL_STORAGE,FILE_CACHE,ROLLBACK_DB storage
    class MEMORY,CACHE,QUEUE,STATS memory
    class SYNC,LOAD,SAVE,RECOVER sync
```

---

## Part 5: Error Handling & Recovery Flow

```mermaid
graph TB
    subgraph "ERROR HANDLING & RESILIENCE"
        direction TB
        
        ERROR["⚠️ Error Occurs"]
        
        subgraph DETECTION["Error Detection"]
            CLASSIFY["Error Classification<br/>- API Error<br/>- Network Error<br/>- File Error<br/>- Timeout<br/>- Permission"]
            SEVERITY["Severity Level<br/>- CRITICAL<br/>- HIGH<br/>- MEDIUM<br/>- LOW<br/>- INFO"]
        end
        
        subgraph HANDLING["Error Handling Strategy"]
            RETRY["Retry Logic<br/>- Exponential Backoff<br/>- Max 3 Attempts<br/>- 1s, 2s, 4s"]
            FALLBACK["Model Fallback<br/>- Try Next Model<br/>- Different Approach<br/>- Local Alternative"]
            CACHE["Cache Fallback<br/>- Use Cached Result<br/>- Stale Data OK?<br/>- Notify User"]
            MANUAL["Manual Intervention<br/>- Suggest Manual Fix<br/>- Collect Input<br/>- Save for Learning"]
        end
        
        subgraph LOGGING["Logging & Analytics"]
            LOG_FILE["Log to File<br/>- Timestamp<br/>- Context<br/>- Stack Trace<br/>- Recovery Action"]
            TELEMETRY["Send Telemetry<br/>- Error Type<br/>- Frequency<br/>- Recovery Success"]
            USER_FEEDBACK["User Notification<br/>- Error Message<br/>- Suggested Action<br/>- Contact Support"]
        end
        
        subgraph RECOVERY["Recovery Actions"]
            RECOVER_STATE["State Recovery<br/>- Reset State<br/>- Clear Cache<br/>- Reload UI"]
            RECOVER_DATA["Data Recovery<br/>- Rollback Changes<br/>- Restore Files<br/>- Undo Operations"]
            RECOVER_PROCESS["Process Recovery<br/>- Restart Worker<br/>- Reconnect API<br/>- Reinit Queue"]
        end
    end
    
    ERROR → CLASSIFY
    CLASSIFY → SEVERITY
    SEVERITY -->|API Error| RETRY
    SEVERITY -->|Network| FALLBACK
    SEVERITY -->|File| RECOVER_DATA
    SEVERITY -->|Critical| RECOVER_STATE
    
    RETRY -->|Success| RESOLVE["✓ Resolved"]
    RETRY -->|Failed| FALLBACK
    FALLBACK -->|Success| RESOLVE
    FALLBACK -->|Failed| CACHE
    CACHE -->|Found| RESOLVE
    CACHE -->|Not Found| MANUAL
    MANUAL -->|User Input| RESOLVE
    MANUAL -->|Deferred| PENDING["⏳ Pending"]
    
    RESOLVE → LOG_FILE
    PENDING → LOG_FILE
    LOG_FILE → TELEMETRY
    TELEMETRY → USER_FEEDBACK
    USER_FEEDBACK →|Notify User| SUCCESS["✓ Complete<br/>User Informed"]
    
    ERROR -->|Data Danger| RECOVER_DATA
    ERROR -->|State Danger| RECOVER_STATE
    ERROR -->|Process Danger| RECOVER_PROCESS
    RECOVER_DATA → LOG_FILE
    RECOVER_STATE → LOG_FILE
    RECOVER_PROCESS → LOG_FILE
    
    classDef error fill:#FFEBEE,stroke:#C62828,color:#000,stroke-width:2px
    classDef detection fill:#FFF3E0,stroke:#E65100,color:#000
    classDef handling fill:#E3F2FD,stroke:#1565C0,color:#000
    classDef logging fill:#F3E5F5,stroke:#6A1B9A,color:#000
    classDef recovery fill:#E8F5E9,stroke:#2E7D32,color:#000
    classDef success fill:#C8E6C9,stroke:#1B5E20,color:#000,stroke-width:2px
    
    class ERROR error
    class DETECTION,CLASSIFY,SEVERITY detection
    class HANDLING,RETRY,FALLBACK,CACHE,MANUAL handling
    class LOGGING,LOG_FILE,TELEMETRY,USER_FEEDBACK logging
    class RECOVERY,RECOVER_STATE,RECOVER_DATA,RECOVER_PROCESS recovery
    class RESOLVE,PENDING,SUCCESS success
```

---

## Part 6: Security & Access Control

```mermaid
graph LR
    subgraph "SECURITY ARCHITECTURE"
        direction TB
        
        USER["👤 User Action<br/>in Renderer"]
        
        subgraph BOUNDARY["Security Boundary<br/>(Preload.ts)"]
            WHITELIST["Method Whitelist<br/>Only expose<br/>approved methods<br/>- fixCode<br/>- detectEnv<br/>- organizeFile"]
            INPUT_VALIDATE["Input Validation<br/>- Type Check<br/>- Size Limit<br/>- Path Validation<br/>- Injection Check"]
            CONTEXT_LIMIT["Context Limiting<br/>- Max File Size<br/>- Max Files<br/>- Timeout"]
        end
        
        subgraph MAIN_CHECKS["Main Process Checks"]
            PERMISSION["Permission Check<br/>- File Access<br/>- Directory Write<br/>- Subprocess"]
            API_KEY_MGMT["API Key Management<br/>- Env Vars Only<br/>- Never Log Keys<br/>- Rotate Keys"]
            PATH_ESCAPE["Path Escape Check<br/>- No ../<br/>- Canonical Path<br/>- Restrict Root"]
        end
        
        subgraph DATA_PROTECTION["Data Protection"]
            ENCRYPTION["Sensitive Data<br/>- Cache encrypted<br/>- No logs of keys<br/>- Secure cleanup"]
            AUDIT["Audit Logging<br/>- Operations log<br/>- Access log<br/>- Error log"]
            CLEANUP["Data Cleanup<br/>- Memory wipe<br/>- Temp cleanup<br/>- Cache expiry"]
        end
    end
    
    USER -->|Call Method| WHITELIST
    WHITELIST -->|Allowed?| INPUT_VALIDATE
    INPUT_VALIDATE -->|Valid?| CONTEXT_LIMIT
    CONTEXT_LIMIT -->|Within Limits?| PERMISSION
    PERMISSION -->|Allowed?| API_KEY_MGMT
    API_KEY_MGMT -->|Secure| PATH_ESCAPE
    PATH_ESCAPE -->|Valid?| EXECUTE["Execute Operation<br/>With Restrictions"]
    
    EXECUTE -->|Log| AUDIT
    EXECUTE -->|Use Keys| ENCRYPTION
    EXECUTE --> CLEANUP
    CLEANUP -->|Return| USER
    
    WHITELIST -->|Denied| BLOCK["🚫 Block<br/>Return Error"]
    INPUT_VALIDATE -->|Invalid| BLOCK
    CONTEXT_LIMIT -->|Exceeded| BLOCK
    PERMISSION -->|Denied| BLOCK
    PATH_ESCAPE -->|Invalid| BLOCK
    BLOCK --> AUDIT
    
    classDef user fill:#C8E6C9,stroke:#2E7D32,color:#000
    classDef boundary fill:#B3E5FC,stroke:#01579B,color:#000,stroke-width:2px
    classDef checks fill:#FFE0B2,stroke:#E65100,color:#000
    classDef protection fill:#F8BBD0,stroke:#C2185B,color:#000
    classDef block fill:#FFCDD2,stroke:#B71C1C,color:#000
    classDef execute fill:#E8F5E9,stroke:#1B5E20,color:#000
    
    class USER user
    class BOUNDARY,WHITELIST,INPUT_VALIDATE,CONTEXT_LIMIT boundary
    class MAIN_CHECKS,PERMISSION,API_KEY_MGMT,PATH_ESCAPE checks
    class DATA_PROTECTION,ENCRYPTION,AUDIT,CLEANUP protection
    class BLOCK block
    class EXECUTE execute
```

---

## Part 7: Deployment & Distribution Architecture

```mermaid
graph TB
    subgraph "BUILD & DEPLOYMENT PIPELINE"
        direction TB
        
        subgraph SOURCE["Source Code"]
            MAIN_TS["main.ts<br/>Electron entry"]
            PRELOAD_TS["preload.ts<br/>Bridge"]
            SRC_DIR["src/<br/>React + Services"]
            JAVA_SRC["java/<br/>Optional"]
        end
        
        subgraph BUILD["Build Stage"]
            TSC_MAIN["tsc main.ts<br/>→ main.js"]
            TSC_PRELOAD["tsc preload.ts<br/>→ preload.js"]
            VITE_BUILD["vite build<br/>→ dist/<br/>optimized"]
            JAVA_BUILD["maven build<br/>→ jar<br/>optional"]
        end
        
        subgraph TEST["Test & Verify"]
            TYPE_CHECK["tsc --noEmit<br/>Type check"]
            LINT["eslint<br/>Code quality"]
            FEATURE_TEST["Feature Tests<br/>- Fixtures<br/>- Smoke tests"]
        end
        
        subgraph PACKAGE["Packaging"]
            ELECTRON_BUILD["electron-builder<br/>Create dist files"]
            WIN_EXE["Windows<br/>.exe installer"]
            MAC_DMG["macOS<br/>.dmg package"]
            LINUX_IMG["Linux<br/>AppImage"]
        end
        
        subgraph DIST["Distribution"]
            GH_RELEASE["GitHub Release<br/>- Auto upload<br/>- Version tag"]
            ELECTRON_UPD["Electron Updater<br/>- Check version<br/>- Auto download<br/>- Staged rollout"]
            MANUAL_DL["Manual Download<br/>- Website<br/>- User download"]
        end
    end
    
    MAIN_TS --> TSC_MAIN
    PRELOAD_TS --> TSC_PRELOAD
    SRC_DIR --> VITE_BUILD
    JAVA_SRC --> JAVA_BUILD
    
    TSC_MAIN --> TYPE_CHECK
    TSC_PRELOAD --> LINT
    VITE_BUILD --> FEATURE_TEST
    
    TYPE_CHECK -->|Pass| ELECTRON_BUILD
    LINT -->|Pass| ELECTRON_BUILD
    FEATURE_TEST -->|Pass| ELECTRON_BUILD
    
    ELECTRON_BUILD --> WIN_EXE
    ELECTRON_BUILD --> MAC_DMG
    ELECTRON_BUILD --> LINUX_IMG
    
    WIN_EXE --> GH_RELEASE
    MAC_DMG --> GH_RELEASE
    LINUX_IMG --> GH_RELEASE
    
    GH_RELEASE --> ELECTRON_UPD
    GH_RELEASE --> MANUAL_DL
    
    ELECTRON_UPD -->|Installed| USER_APP["👤 User App<br/>Auto Updated"]
    MANUAL_DL -->|Downloaded| USER_INSTALL["👤 User Install"]
    
    classDef source fill:#E3F2FD,stroke:#1976D2,color:#000
    classDef build fill:#F3E5F5,stroke:#7B1FA2,color:#000
    classDef test fill:#E8F5E9,stroke:#388E3C,color:#000
    classDef package fill:#FFF3E0,stroke:#F57C00,color:#000
    classDef dist fill:#FCE4EC,stroke:#C2185B,color:#000
    classDef user fill:#C8E6C9,stroke:#1B5E20,color:#000
    
    class SOURCE,MAIN_TS,PRELOAD_TS,SRC_DIR,JAVA_SRC source
    class BUILD,TSC_MAIN,TSC_PRELOAD,VITE_BUILD,JAVA_BUILD build
    class TEST,TYPE_CHECK,LINT,FEATURE_TEST test
    class PACKAGE,ELECTRON_BUILD,WIN_EXE,MAC_DMG,LINUX_IMG package
    class DIST,GH_RELEASE,ELECTRON_UPD,MANUAL_DL dist
    class USER_APP,USER_INSTALL user
```

---

## Part 8: Component Dependency Matrix

| Component | Depends On | Used By | Criticality |
|-----------|-----------|---------|------------|
| **App.tsx** | React, Event Bus, IPC Types | Shimeji, Menus, Features | CRITICAL |
| **AI Router** | Settings Manager, Ollama Client | All Features | CRITICAL |
| **Code Fixer Service** | AI Router, Task Executor | Code Fixer UI | HIGH |
| **File Organizer Service** | AI Router, Safe Executor | File Organizer UI | HIGH |
| **Environment Detector** | AI Router, Task Executor | Environment UI | MEDIUM |
| **Codebase Chat** | AI Router, Event Bus | Chat UI | MEDIUM |
| **Discussion Room** | Socket.io, Event Bus | Room UI | LOW |
| **Preload Bridge** | Electron IPC | All Services | CRITICAL |
| **IPC Types** | TypeScript | Preload, Main | CRITICAL |
| **Task Executor** | Queue Manager, Child Process | Services | HIGH |
| **Safe File Executor** | Rollback DB, File System | File Organizer | HIGH |
| **Logger** | File System | All Services | MEDIUM |
| **Permission Manager** | None | Services | HIGH |
| **Event Bus** | None | App, Services | MEDIUM |

---

## Part 9: Runtime Metrics & Monitoring

```mermaid
graph TB
    subgraph "APPLICATION OBSERVABILITY"
        direction TB
        
        subgraph METRICS["Performance Metrics"]
            LATENCY["API Latency<br/>- Gemini: ~500ms<br/>- OpenAI: ~1s<br/>- Ollama: ~2s"]
            THROUGHPUT["Throughput<br/>- Requests/min<br/>- Tokens/min<br/>- Files/min"]
            RESOURCE["Resource Usage<br/>- Memory: <500MB<br/>- CPU: <20%<br/>- Disk: <1GB"]
        end
        
        subgraph LOGGING["Logging & Tracing"]
            STRUCTURED["Structured Logs<br/>- JSON format<br/>- Timestamp<br/>- Request ID<br/>- Component<br/>- Level"]
            DEBUG_LOG["Debug Logging<br/>- Development: Verbose<br/>- Production: Info<br/>- Errors: Always"]
            TRACE["Distributed Trace<br/>- Request flow<br/>- Service calls<br/>- Timing details"]
        end
        
        subgraph ALERTS["Alerting & Monitoring"]
            ERROR_RATE["Error Rate Alert<br/>- Threshold: >5%<br/>- Window: 5min<br/>- Action: Notify Dev"]
            LATENCY_ALERT["Latency Alert<br/>- Threshold: >5s<br/>- Window: 10min<br/>- Action: Fallback"]
            RESOURCE_ALERT["Resource Alert<br/>- Memory: >800MB<br/>- CPU: >80%<br/>- Action: Cleanup"]
        end
        
        subgraph DASHBOARD["Health Dashboard"]
            STATUS["System Status<br/>- Last 24h<br/>- Error count<br/>- Success rate"]
            FEATURE_STATS["Feature Statistics<br/>- Code Fixer runs<br/>- Org operations<br/>- Chat messages"]
            MODEL_PERF["Model Performance<br/>- Success rate<br/>- Avg latency<br/>- Cost per op"]
        end
    end
    
    LATENCY --> DASHBOARD
    THROUGHPUT --> DASHBOARD
    RESOURCE --> DASHBOARD
    STRUCTURED --> TRACE
    DEBUG_LOG --> TRACE
    TRACE --> DASHBOARD
    ERROR_RATE --> ALERTS
    LATENCY_ALERT --> ALERTS
    RESOURCE_ALERT --> ALERTS
    ALERTS --> DASHBOARD
    
    classDef metrics fill:#E0F2F1,stroke:#00796B,color:#000
    classDef logging fill:#F1F8E9,stroke:#558B2F,color:#000
    classDef alerts fill:#FFEBEE,stroke:#B71C1C,color:#000
    classDef dashboard fill:#FFF3E0,stroke:#E65100,color:#000
    
    class METRICS,LATENCY,THROUGHPUT,RESOURCE metrics
    class LOGGING,STRUCTURED,DEBUG_LOG,TRACE logging
    class ALERTS,ERROR_RATE,LATENCY_ALERT,RESOURCE_ALERT alerts
    class DASHBOARD,STATUS,FEATURE_STATS,MODEL_PERF dashboard
```

---

## Key Takeaways

1. **Modularity**: Each feature is self-contained but shares core services
2. **Resilience**: Multi-layer error handling with fallback mechanisms
3. **Safety**: IPC contracts prevent runtime errors, preload boundary ensures security
4. **Observability**: Comprehensive logging, metrics, and tracing
5. **Extensibility**: New features can be added following the established patterns
6. **Performance**: Streaming responses, caching, and smart queuing
7. **Reliability**: Transaction logging, rollback support, crash recovery

