# Manual Test Samples

These samples are intentionally visible so you can pick them from DevOps Lite and verify each feature manually.

Run this before testing:

```bash
npm run reset:samples
```

Use the folders under `samples/workdir` in the app. They are safe to mutate and can be reset at any time. The source copies live under `samples/pristine`.

## Code Fixer

Use the three Code Fixer cards in the app.

- Clipboard scope: edit `samples/workdir/code-fixer/clipboard-snippet.js`, press the Copy button on the sample card or editor, then run Clipboard scope.
- Single file scope: edit and run `samples/workdir/code-fixer/single-file-bug.js`; it includes missing braces, missing assignment syntax, missing semicolons, and logging typos.
- Java codebase scope: use `samples/workdir/code-fixer-java-codebase`; it includes multiple files with Java syntax and output-call defects. The warning icon means the local LLM/API must have sufficient power for a whole-codebase Java fix.

Manual-mode expected fixes include `consol.log` to `console.log`, `System.oot` to `System.out`, missing semicolons, missing assignment operators, and missing closing braces.

## Environment Builder

Use the Environment Builder sample cards in the app.

### Node Environment

Use `samples/workdir/env-builder-node-basic`.

This is a minimal Node project with no external dependencies. It should install and run cleanly:

```bash
cd samples/workdir/env-builder-node-basic
npm install
npm test
npm start
```

Expected output includes `env-builder sample ok`.

### Python Environment

Use `samples/workdir/env-builder-python-basic`.

This is a small Python project with `requirements.txt` and a smoke test module. The detected setup plan should include virtual environment creation and dependency installation. Use `Run All` in the setup overlay to execute every generated step in order.

## File Organizer

Use the File Organizer sample cards in the app.

### Logic Organizer

Use `samples/workdir/file-organizer-logic` with Professional sorting.

Expected preview examples:

- `Product Roadmap.md` -> `docs/Product Roadmap.md`
- `customer screenshot.png` -> `assets/images/customer screenshot.png`
- `support tickets.csv` -> `data/support tickets.csv`
- `trace.log` -> `logs/trace.log`
- `embedding-model.gguf` -> `models/embedding-model.gguf`

### AI Organizer

Use `samples/workdir/file-organizer-ai` with AI instruction.

Suggested instruction:

```txt
Group financial spreadsheets into Financials, documents into Documents, and images into Images. Rename poorly formatted names to snake_case.
```

Expected preview examples:

- `Q1 Budget.csv` -> `Financials/q1_budget.csv`
- `Project Notes.md` -> `documents/project_notes.md`
- `logo final.png` -> `images/logo_final.png`
- `Vendor Receipt.pdf` -> `Financials/vendor_receipt.pdf`
- `Launch Checklist.txt` -> `documents/launch_checklist.txt`
- `Team Photo.JPG` -> `images/team_photo.jpg`

Apply should move only the approved files and leave protected files such as `package.json` and `.env.local` in place.
