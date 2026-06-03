# DevOps Lite - Product Roadmap

## Phase 1: ✅ Complete - Architecture & Core Implementation
- Event Bus and State Machine infrastructure
- Code Fixer with AI integration
- Environment Builder with project scanning
- File Organizer with redundancy detection
- UI overlays and components

## Phase 2: 🔧 Current - Runtime Stabilization
- **Fix npm run dev startup issue** (exit code 1)
- Verify Electron window creation on Windows
- Test AI API integration end-to-end
- Test Cloud AI and Local Ollama route switching end-to-end
- Verify Ollama CLI missing-on-PATH fallback to HTTP `/api/pull`
- Verify Shimeji icon click toggles feature menu open/closed
- Validate all three features work in development environment

**Expected**: Next 2-3 days

## Phase 3: 📋 Next - Feature Polish & Testing
- Add automated test suite (Vitest)
- Improve error messaging and user feedback
- Add logging and debugging tools
- Test on macOS and Linux
- Performance optimization

**Estimated**: Week of May 19

## Phase 4: 📦 Release - Production Build
- electron-builder packaging
- Application signing
- Release automation
- Distribution setup

**Estimated**: Week of May 26

## Backlog - Future Enhancements

### Short Term (Post-Release)
- User preferences/settings storage (AI settings now stored in `~/.devops-lite/ai-settings.json`)
- Code fixer history tracking
- Environment builder caching
- File organizer undo/redo UI

### Medium Term
- Custom AI model support (Cloud API model strings and Local Ollama routing are now implemented)
- Plugin system for features
- Community templates
- Multi-language support

### Long Term
- Offline mode support
- Collaborative features
- Cloud sync and backup
- Advanced AI reasoning models

## Critical Blockers

| Blocker | Impact | Status | Owner |
|---------|--------|--------|-------|
| npm run dev exit code 1 | Blocks all development | 🔴 Active | - |
| Electron window rendering | Blocks UI testing | 🟡 Known | Shape issue (problems.md) |

## Feature Metrics

| Feature | Completion | Testing | Documentation |
|---------|-----------|---------|-----------------|
| Code Fixer | 100% | Pending | ✅ Complete |
| Env Builder | 100% | Pending | ✅ Complete |
| File Organizer | 100% | Pending | ✅ Complete |
| AI Settings / Routing | 100% | Pending | ✅ Complete |
| Architecture | 100% | Pending | ✅ Complete |

## User Setup Notes

- Cloud AI requires a provider API key and model string in AI Settings.
- Local AI requires Ollama running at `http://localhost:11434`; the default model is `qwen2.5-coder:7b`.
- If Windows says `'ollama' is not recognized as an internal or external command`, the Ollama CLI is not on PATH even if the local server is running. The app falls back to the HTTP pull API where possible. Users can fix the CLI by reinstalling/updating Ollama, restarting DevOps Lite, and checking `ollama --version`.
- Clicking the Shimeji icon toggles the feature menu open and closed.
