# Advanced AI File Organizer

This feature is intentionally isolated under `src/features/file-organizer`.

## Architecture Plan

Data flow:

```txt
Filesystem event or manual request
  -> debounced watcher / IPC request
  -> sandboxed scan
  -> heuristic classifier
  -> optional embedding provider
  -> optional LLM provider
  -> rule engine
  -> preview queue
  -> safe operation executor
  -> rollback log
```

## Safety Strategy

- Feature flags gate indexing, AI reasoning, watchers, and autonomous apply.
- All paths resolve through the organizer sandbox root.
- Protected directories include `.git`, `node_modules`, build output, lockfiles, env files, and organizer internals.
- Apply is preview-first. Autonomous mode requires confidence `>= 0.90`.
- File moves are reversible and logged to `.devops-lite-organizer/rollback-<batch>.jsonl`.
- The executor validates conflicts before touching the filesystem.
- Failures return errors to IPC callers and do not throw into app lifecycle code.

## Extensibility

- `AIProvider` abstracts OpenAI, Gemini, Ollama, or local models.
- `VectorIndex` abstracts sqlite-vec, LanceDB, ChromaDB, or in-memory development indexes.
- Worker contracts are separate from the current IPC integration so heavy scan/index work can move to `worker_threads`.
- `database/schema.sql` documents the production SQLite schema for metadata, operations, and rollback records.

## Current Integration

The existing `devops:file:organize` IPC path generates a preview plan. The existing `devops:file:apply-org` IPC path delegates to `SafeFileOperationExecutor` for validation, sandboxing, atomic moves, and rollback logging.
