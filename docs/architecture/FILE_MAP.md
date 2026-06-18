# Architecture Documentation - Complete File Map & Index

## 📍 Visual Navigation Map

```
START HERE
    │
    ├─→ Want quick overview (5 min)?
    │   └─→ Read: ARCHITECTURE_SUMMARY.md (this directory)
    │       └─→ Then: CHEATSHEET.md (visual diagrams)
    │
    ├─→ Want quick facts (10 min)?
    │   └─→ Read: QUICK_REFERENCE.md
    │       └─→ Contains: 30-second summary + feature breakdown
    │
    ├─→ Want to see main diagram (15 min)?
    │   └─→ Open: ARCHITECTURE.md (root directory)
    │       └─→ View: One comprehensive Mermaid diagram
    │           └─→ Export: Use EXPORT_GUIDE.md
    │
    ├─→ Want deep technical details (60 min)?
    │   └─→ Read: ARCHITECTURE_EXTENDED.md (root directory)
    │       ├─→ Part 1: Feature Interactions
    │       ├─→ Part 2: AI Routing & Fallback
    │       ├─→ Part 3: IPC Contracts
    │       ├─→ Part 4: Data Persistence
    │       ├─→ Part 5: Error Handling
    │       ├─→ Part 6: Security
    │       ├─→ Part 7: Deployment
    │       ├─→ Part 8: Dependencies
    │       └─→ Part 9: Monitoring
    │
    ├─→ Want to export diagrams?
    │   └─→ Read: EXPORT_GUIDE.md
    │       ├─→ Method 1: Mermaid Live Editor (easiest)
    │       ├─→ Method 2: VS Code Extension (integrated)
    │       ├─→ Method 3: Mermaid CLI (batch)
    │       ├─→ Method 4: Inline SVG (web)
    │       └─→ Method 5: PlantUML (alternative)
    │
    ├─→ Want navigation help?
    │   └─→ Read: docs/architecture/README.md (full index)
    │       └─→ Contains: File locations, use cases, resources
    │
    └─→ Want to see source code?
        └─→ Browse: src/ directory
            ├─→ src/features/ (5 features)
            ├─→ src/services/ (core services)
            ├─→ src/components/ (UI components)
            └─→ src/ipc-types.ts (type contracts)
```

---

## 📚 Documentation Files Overview

### **Root Directory Files** (Start Here!)

```
📄 ARCHITECTURE.md
├─ Content: Main comprehensive architecture diagram + patterns
├─ Size: ~5,000 words
├─ Read Time: 15-20 minutes
├─ Best For: Understanding complete system at once
├─ Contains:
│  ├─ 1 BIG System Architecture Diagram (Mermaid)
│  ├─ Architecture layer breakdown (5 layers)
│  ├─ 5 features detailed explanation
│  ├─ AI fallback strategy
│  ├─ IPC safety patterns
│  ├─ Safe file operations
│  ├─ Data flow examples
│  ├─ Technology stack
│  ├─ Quality attributes
│  └─ Deployment architecture
└─ Action: 📥 Export using EXPORT_GUIDE.md methods

📄 ARCHITECTURE_EXTENDED.md
├─ Content: 9-part detailed technical specifications
├─ Size: ~10,000 words
├─ Read Time: 60 minutes (all parts)
├─ Best For: Deep technical understanding & debugging
├─ Contains:
│  ├─ Part 1: Feature Interaction Architecture (5 detailed flows)
│  ├─ Part 2: AI Routing & Fallback Intelligence (pipeline)
│  ├─ Part 3: IPC Communication Contract Map (security)
│  ├─ Part 4: Data Persistence & State Management (storage)
│  ├─ Part 5: Error Handling & Recovery Flow (resilience)
│  ├─ Part 6: Security & Access Control (defense)
│  ├─ Part 7: Deployment & Distribution Architecture (release)
│  ├─ Part 8: Component Dependency Matrix (relationships)
│  └─ Part 9: Runtime Metrics & Monitoring (observability)
└─ Action: Use for specific technical questions

📄 ARCHITECTURE_SUMMARY.md
├─ Content: Overview of entire documentation package
├─ Size: ~3,000 words
├─ Read Time: 10 minutes
├─ Best For: Understanding what documentation exists
├─ Contains:
│  ├─ What you have (file list)
│  ├─ The 5 core features (summary)
│  ├─ Key architecture patterns
│  ├─ Documentation structure (learning paths)
│  ├─ Use cases (when to use what)
│  ├─ Next steps
│  └─ Checklist (completeness validation)
└─ Action: Start here for overview
```

---

### **docs/architecture/ Directory Files**

```
📄 README.md (Index & Navigation)
├─ Content: Complete index and navigation guide
├─ Size: ~4,000 words
├─ Read Time: 15 minutes
├─ Best For: Finding specific information
├─ Contains:
│  ├─ Documentation file descriptions
│  ├─ File locations & paths
│  ├─ System overview in 30 seconds
│  ├─ Main architecture diagram overview
│  ├─ Feature-specific architecture
│  ├─ Security & safety features
│  ├─ Performance characteristics
│  ├─ AI model strategy
│  ├─ Scalability & extensibility
│  ├─ Testing strategy
│  ├─ Related documents
│  ├─ Quick navigation by use case
│  └─ Support & questions
└─ Action: Use as navigation hub

📄 QUICK_REFERENCE.md
├─ Content: Condensed overview + fact tables
├─ Size: ~3,000 words
├─ Read Time: 10 minutes (or lookup specific items)
├─ Best For: Quick facts, feature details, commands
├─ Contains:
│  ├─ 30-second system overview
│  ├─ 5 features at a glance (table)
│  ├─ Architecture layers (visual)
│  ├─ Key services map
│  ├─ IPC contract pattern
│  ├─ AI fallback chain
│  ├─ File safety pattern
│  ├─ Error recovery priority
│  ├─ State management
│  ├─ Security layers
│  ├─ Feature dependencies
│  ├─ Performance tips
│  ├─ Technology stack
│  ├─ Common commands
│  ├─ File organization (structure)
│  ├─ Extending architecture (how-to)
│  └─ Troubleshooting quick links
└─ Action: Use for quick lookups & reference

📄 CHEATSHEET.md
├─ Content: ASCII diagrams & visual reference
├─ Size: ~4,000 words
├─ Read Time: 15 minutes (or scan sections)
├─ Best For: Visual learners, quick understanding
├─ Contains:
│  ├─ System architecture ASCII art
│  ├─ 5 features explained visually
│  ├─ Request-response cycle diagram
│  ├─ Security layers visualization
│  ├─ AI model selection flowchart
│  ├─ Data flow in file organizer
│  ├─ Key files & locations
│  ├─ Performance targets table
│  ├─ Responsive design specs
│  ├─ Build & deployment flow
│  ├─ Component dependencies
│  └─ Learning path
└─ Action: Use for understanding with visuals

📄 EXPORT_GUIDE.md
├─ Content: How to export Mermaid diagrams
├─ Size: ~3,500 words
├─ Read Time: 15 minutes (or skip to Method)
├─ Best For: Exporting diagrams to images/PDF
├─ Contains:
│  ├─ 5 export methods (detailed steps)
│  │  ├─ Method 1: Mermaid Live Editor (easiest)
│  │  ├─ Method 2: VS Code Extension (integrated)
│  │  ├─ Method 3: Mermaid CLI (batch)
│  │  ├─ Method 4: Inline SVG (web)
│  │  └─ Method 5: PlantUML (alternative)
│  ├─ Available diagrams list
│  ├─ Recommended export sizes
│  ├─ Quick export commands
│  ├─ Customization options
│  ├─ Troubleshooting
│  ├─ Directory structure for exports
│  ├─ Automated export scripts
│  ├─ Viewing & sharing tips
│  └─ Verification checklist
└─ Action: Use to export diagrams to PNG/SVG/PDF
```

---

## 🗺️ Complete File Map

```
Root Directory (DevOS-lite/)
│
├─ ARCHITECTURE.md ✅ MAIN DIAGRAM
│  └─ 1 comprehensive Mermaid diagram showing entire system
│
├─ ARCHITECTURE_EXTENDED.md ✅ DETAILED TECHNICAL
│  └─ 9 parts covering all technical aspects
│
├─ ARCHITECTURE_SUMMARY.md ✅ THIS PACKAGE OVERVIEW
│  └─ Overview of all documentation created
│
├─ docs/architecture/ ✅ DOCUMENTATION FOLDER
│  │
│  ├─ README.md ✅ NAVIGATION HUB
│  │  └─ Complete index & file descriptions
│  │
│  ├─ QUICK_REFERENCE.md ✅ QUICK FACTS
│  │  └─ 30-second overview + lookup tables
│  │
│  ├─ CHEATSHEET.md ✅ VISUAL REFERENCE
│  │  └─ ASCII diagrams & visual explanations
│  │
│  ├─ EXPORT_GUIDE.md ✅ EXPORT INSTRUCTIONS
│  │  └─ How to export diagrams to PNG/SVG/PDF
│  │
│  └─ (diagrams/ folder) [FOR EXPORTS]
│     ├─ png/ [exported PNG files]
│     ├─ svg/ [exported SVG files]
│     └─ pdf/ [exported PDF files]
│
├─ src/ [SOURCE CODE]
│  ├─ features/ [5 FEATURES]
│  │  ├─ code-fixer/
│  │  ├─ environment-builder/
│  │  └─ file-organizer/
│  ├─ services/ [CORE SERVICES]
│  │  ├─ ai-manager.ts
│  │  ├─ ai-routing/
│  │  ├─ task-executor.ts
│  │  ├─ queue-manager.ts
│  │  └─ ...
│  ├─ components/ [UI COMPONENTS]
│  │  ├─ overlays/ [5 FEATURE OVERLAYS]
│  │  ├─ modals/ [DIALOGS]
│  │  └─ Shimeji.tsx
│  └─ ipc-types.ts [IPC CONTRACTS]
│
├─ main.ts [ELECTRON ENTRY]
├─ preload.ts [IPC BRIDGE]
│
├─ tests/ [TEST FIXTURES]
│  └─ fixtures/ [TEST DATA]
│
└─ [OTHER PROJECT FILES]
   ├─ package.json
   ├─ tsconfig.json
   ├─ vite.config.ts
   └─ ...
```

---

## 🎯 How to Use Each File

### **When you want to...**

**...understand the complete system (15 min)**
1. Read: [ARCHITECTURE_SUMMARY.md](../ARCHITECTURE_SUMMARY.md) (this directory)
2. Look at: [ARCHITECTURE.md](../ARCHITECTURE.md) main diagram
3. Export: Use [EXPORT_GUIDE.md](./EXPORT_GUIDE.md)

**...get quick facts (5 min)**
1. Check: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. Look at: [CHEATSHEET.md](./CHEATSHEET.md) (visual)

**...find specific information (on-demand)**
1. Use: [docs/architecture/README.md](./README.md) index
2. Check: Table of contents in each file

**...teach a team member (30 min)**
1. Show: [CHEATSHEET.md](./CHEATSHEET.md) overview
2. Discuss: Feature details from [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. Export: Main diagram from [ARCHITECTURE.md](../ARCHITECTURE.md)

**...debug a specific issue (15 min)**
1. Identify: Issue type (IPC, AI, File Op, etc.)
2. Find: Relevant section in [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md)
3. Check: Error handling (Part 5) or specific feature flow (Part 1)

**...export diagrams for presentation (5 min)**
1. Follow: [EXPORT_GUIDE.md](./EXPORT_GUIDE.md)
2. Method 1 (easiest): Mermaid Live Editor
3. Method 2 (integrated): VS Code Extension
4. Method 3 (batch): Mermaid CLI

**...add a new feature (30 min)**
1. Review: Feature patterns in [ARCHITECTURE.md](../ARCHITECTURE.md)
2. Check: Extensibility in [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md)
3. Look at: Existing feature in `src/features/`

**...optimize AI routing (30 min)**
1. Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) Part 2
2. Review: AI fallback chain in [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. Check: AI Router in `src/services/ai-routing/`

**...understand security (20 min)**
1. Read: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) Part 6
2. Check: Security layers in [CHEATSHEET.md](./CHEATSHEET.md)
3. Review: Preload in `preload.ts`

---

## 📊 File Reading Time Matrix

| File | Quick Read | Full Read | Best Time | Best For |
|------|-----------|-----------|-----------|----------|
| ARCHITECTURE_SUMMARY.md | 10 min | 15 min | Anytime | Overview |
| QUICK_REFERENCE.md | 5 min | 10 min | First time | Reference |
| CHEATSHEET.md | 10 min | 15 min | Learning | Visual |
| ARCHITECTURE.md | 15 min | 20 min | Planning | Diagram |
| ARCHITECTURE_EXTENDED.md | - | 60 min | Deep work | Technical |
| EXPORT_GUIDE.md | 5 min | 15 min | On demand | Export |
| docs/architecture/README.md | 10 min | 15 min | Lost? | Navigation |

---

## 🎓 Recommended Reading Sequences

### **Path 1: Executive Summary (15 min total)**
1. This file (FILE_MAP.md) → 2 min
2. ARCHITECTURE_SUMMARY.md → 10 min
3. Look at main diagram in ARCHITECTURE.md → 3 min

### **Path 2: Quick Onboarding (30 min total)**
1. ARCHITECTURE_SUMMARY.md → 10 min
2. QUICK_REFERENCE.md → 10 min
3. CHEATSHEET.md (scan) → 5 min
4. View ARCHITECTURE.md diagram → 5 min

### **Path 3: Technical Depth (90 min total)**
1. QUICK_REFERENCE.md → 10 min
2. ARCHITECTURE.md → 20 min
3. ARCHITECTURE_EXTENDED.md (all 9 parts) → 60 min

### **Path 4: Debugging Focus (45 min total)**
1. Identify issue type → 5 min
2. Find relevant section in ARCHITECTURE_EXTENDED.md → 20 min
3. Review error handling patterns (Part 5) → 15 min
4. Check source code → 5 min

### **Path 5: Team Presentation (45 min prep)**
1. Export diagram from ARCHITECTURE.md (10 min)
2. Prepare talking points from QUICK_REFERENCE.md (20 min)
3. Practice with CHEATSHEET.md visuals (15 min)

### **Path 6: Feature Development (60 min)**
1. Review feature patterns in ARCHITECTURE.md → 15 min
2. Check ARCHITECTURE_EXTENDED.md Part 1 → 20 min
3. Review existing feature code → 15 min
4. Check IPC patterns (Part 3) → 10 min

---

## 🎁 What Each File Gives You

| File | Gives You |
|------|-----------|
| **ARCHITECTURE_SUMMARY.md** | Overview of entire documentation package |
| **ARCHITECTURE.md** | Complete system architecture in ONE diagram |
| **ARCHITECTURE_EXTENDED.md** | Deep technical details for every aspect |
| **QUICK_REFERENCE.md** | Lookup tables, quick facts, command reference |
| **CHEATSHEET.md** | ASCII diagrams, visual flows, quick visuals |
| **EXPORT_GUIDE.md** | How to export diagrams to PNG/SVG/PDF |
| **docs/architecture/README.md** | Navigation index and file descriptions |

---

## 📍 Navigation Shortcuts

**Lost? Don't know where to start?**
→ Read: [ARCHITECTURE_SUMMARY.md](../ARCHITECTURE_SUMMARY.md) (this directory)

**Want a diagram?**
→ Open: [ARCHITECTURE.md](../ARCHITECTURE.md) and use [EXPORT_GUIDE.md](./EXPORT_GUIDE.md)

**Need quick facts?**
→ Check: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (tables & lists)

**Like visual explanations?**
→ Read: [CHEATSHEET.md](./CHEATSHEET.md) (ASCII diagrams)

**Need deep details?**
→ Study: [ARCHITECTURE_EXTENDED.md](../ARCHITECTURE_EXTENDED.md) (9 parts)

**Want to export?**
→ Follow: [EXPORT_GUIDE.md](./EXPORT_GUIDE.md) (5 methods)

**Looking for something specific?**
→ Use: [docs/architecture/README.md](./README.md) (index)

---

## ✅ Quality Checklist

This documentation package includes:

- ✅ 1 comprehensive system architecture diagram
- ✅ 8+ detailed component diagrams
- ✅ All 5 features fully documented
- ✅ All 5 architecture layers explained
- ✅ Security analysis (multi-layer)
- ✅ Error handling patterns
- ✅ Performance metrics
- ✅ Technology stack details
- ✅ Deployment pipeline
- ✅ Component dependencies
- ✅ Data flow illustrations
- ✅ Multiple learning paths
- ✅ Export guidance (5 methods)
- ✅ Quick reference tables
- ✅ Visual ASCII diagrams
- ✅ Command references
- ✅ Troubleshooting guide
- ✅ Extensibility patterns
- ✅ 15,000+ words of content
- ✅ Professional documentation

---

## 🚀 Getting Started Right Now

### **Option A: 5-Minute Overview**
1. Read this file (FILE_MAP.md) → 3 min
2. Skim [ARCHITECTURE_SUMMARY.md](../ARCHITECTURE_SUMMARY.md) → 2 min
→ **You'll understand what documentation exists and how to use it**

### **Option B: 30-Minute Understanding**
1. Read [ARCHITECTURE_SUMMARY.md](../ARCHITECTURE_SUMMARY.md) → 10 min
2. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → 10 min
3. View [ARCHITECTURE.md](../ARCHITECTURE.md) diagram → 10 min
→ **You'll understand the complete system**

### **Option C: Export Diagrams Now**
1. Open [ARCHITECTURE.md](../ARCHITECTURE.md) in VS Code
2. Follow Method 1 in [EXPORT_GUIDE.md](./EXPORT_GUIDE.md)
3. Use Mermaid Live Editor to export
→ **You'll have presentation-ready diagrams**

---

## 💬 Still Questions?

**Can't find what you're looking for?**
1. Check [docs/architecture/README.md](./README.md) - Comprehensive index
2. Search this document (Ctrl+F) for keywords
3. Check source code in `src/` directory
4. Review test fixtures in `tests/fixtures/`

---

**Last Updated**: 2026-06-10
**Version**: 1.0 Complete
**Status**: ✅ Ready to Use

