# DevOS Lite 5-Minute Speaker Notes

## Timing

- Slide 1: 20 seconds
- Slide 2: 30 seconds
- Slide 3: 45 seconds
- Slide 4: 40 seconds
- Slide 5: 35 seconds
- Slide 6: 30 seconds
- Slide 7 + live demo: 90 seconds
- Buffer: 10 seconds

## Compact Script

### 1. Opening
DevOS Lite is a floating desktop AI assistant for repetitive developer workflows: code repair, environment setup, and safe project organization. The point is not to replace the IDE, but to stay available beside it as a small workflow layer.

### 2. Problem
Developers lose time switching between editor, terminal, docs, and file explorer. DevOS Lite turns those scattered chores into one guided loop with preview and confirmation before risky actions.

### 3. Architecture
The key architecture decision is separation. React owns the UI. Preload exposes a limited IPC bridge. Electron main owns privileged work. Feature modules call the AI router and safety engine. The renderer never directly owns filesystem power.

### 4. Feature Proof
The demo uses implemented features: AI Settings, File Organizer, Environment Builder, and Code Fixer. File Organizer is the strongest live demo because it shows planning, safe apply, and rollback.

### 5. Safety
The engineering differentiator is preview-first automation. The app scans, plans, previews, applies, and writes rollback metadata. Tests verify dry-run behavior and rollback recovery.

### 6. Timeline and Labor
Member 1 led the core engineering: architecture, Electron IPC, AI routing, feature implementation, safety, tests, and demo flow. Member 2 supported lightly on documentation and review. Member 3 supported basic timing and final review.

### 7. Demo Handoff
Demo order: AI Settings, File Organizer preview, apply or rollback status, then Environment Builder or Code Fixer. Closing line: DevOS Lite is a safe AI workflow layer for local developer work.
