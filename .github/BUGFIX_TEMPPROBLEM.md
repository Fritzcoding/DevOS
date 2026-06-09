# Bugfix Workflow

When debugging a live issue in this repository, update 	tempproblem.md with the latest problem description, observed behavior, and current status before making code changes.

This ensures the current bug is tracked clearly and the fix path remains documented.

Current user-facing setup notes to keep documented:
- Local AI requires Ollama running at `http://localhost:11434` and model `qwen2.5-coder:7b`.
- If `'ollama' is not recognized as an internal or external command`, the server may be running but the CLI is not on PATH. The app falls back to HTTP pull when possible; users can fix the CLI by reinstalling/updating Ollama and verifying `ollama --version`.
- Clicking the Shimeji icon toggles the feature menu open/closed.
