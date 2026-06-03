# DevOps Lite - Current Problem Analysis

## Current Problem: AI File Organizer Plan/Apply Mismatch

### Problem Description
In the AI File Organizer, the preview said it would move 7 files, but after apply
the result reported 9 files processed. The user's `.docx`, `.js`, `.html`,
`.csv`, and `.xlsx` files were not moved as expected. The organizer also created
folders named `assets`, `docs`, and `.devops-lite-organizer` after the user asked:

> Organize the folder 'sandbox_clutter' professionally. Group files cleanly into
> standard directories like Documents, Images, Financials, and Code, and rename
> poorly formatted files into clean snake_case.

### Observed Behavior
- Preview move count and apply result count do not match.
- Apply count includes created directories, so the UI can report more "files"
  than the preview listed.
- AI instruction category planning does not cover `.docx`, `.xlsx`, `.csv`,
  `.html`, or general code files well enough.
- Requested category names such as `Documents`, `Images`, `Financials`, and
  `Code` are not preserved; generic lowercase folders such as `assets` and
  `docs` can be produced instead.
- Rename intent is ignored or blocked because current move validation prevents
  filename changes unless rename operations are explicitly produced.
- `.devops-lite-organizer` is created as rollback metadata, but it is not
  surfaced clearly as internal recovery state rather than a user content folder.

### Suspected Root Causes
1. `SafeFileOperationExecutor.apply()` increments `appliedCount` for every
   operation, including `mkdir`, while the preview displays only `moves.length`.
2. `main.ts` maps `result.appliedCount` directly to `filesProcessed`.
3. `buildInstructionCategoryPlan()` only recognizes a narrow set of document,
   image, and script extensions and does not support financial or code grouping.
4. Folder naming is hardcoded to `assets`, `assets/images`, `docs`, or
   `docs/documents` instead of using directories explicitly named by the user.
5. `buildExplicitInstructionPlan()` rejects rename moves by requiring identical
   source and destination basenames.

### Required Fix
- Separate apply result counts for file operations and directory operations.
- Return user-facing `filesProcessed` as moved/renamed/archived files only.
- Expand AI instruction grouping to support `Documents`, `Images`,
  `Financials`, and `Code`.
- Support common file extensions:
  - Documents: `.doc`, `.docx`, `.pdf`, `.txt`, `.md`, `.rtf`, `.odt`
  - Financials: `.csv`, `.xls`, `.xlsx`, `.ods`, `.tsv`
  - Code: `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.json`, `.py`,
    `.java`, `.go`, `.rs`, `.sh`, `.ps1`, `.bat`
  - Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.ico`
- Implement safe snake_case rename generation when explicitly requested.
- Keep rollback metadata, but report it separately so it is not confused with
  user-requested folders.

### Resolution
- Expanded AI instruction planning so requested categories such as `Documents`,
  `Images`, `Financials`, and `Code` are honored instead of falling back to
  generic `assets`/`docs` folder names.
- Added support for `.docx`, `.xlsx`, `.csv`, `.html`, `.js`, and related
  document/image/financial/code extensions.
- Added explicit snake_case rename generation when the instruction asks for
  clean snake_case names.
- Collapsed repeated final extensions during cleanup, e.g. `index.html.html`
  becomes `index.html`.
- Removed redundant explicit `mkdir` apply operations from the legacy plan
  adapter because move/rename operations already create parent directories.
- Split apply reporting into file, directory, and total operation counts, and
  mapped user-facing `filesProcessed` to file operations only.
- Updated success messaging to identify `.devops-lite-organizer` as rollback
  metadata.

### Verification
- `npm.cmd run type-check` passes.
- `npm.cmd run compile:main` passes.
- Re-ran `npm.cmd run type-check` after the UI success-message update.
- Planner test against `C:\Users\Fritz\Downloads\test\sandbox_clutter` generated
  12 moves into `Financials`, `Documents`, `Images`, and `Code`.
- Apply test on a temporary copy succeeded with:
  - preview moves: 12
  - operations: 12
  - file operations: 12
  - directory operations: 0
  - skipped: 0

### Current Status
- [x] Problem recorded.
- [x] Code fix implemented.
- [x] Tested against `sandbox_clutter` via a temporary copy.
- [x] Resolved entry added to `.github/problems.md`.

---
Created: May 27, 2026
Status: RESOLVED
