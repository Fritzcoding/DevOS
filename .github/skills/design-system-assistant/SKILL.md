---
name: design-system-assistant
description: >-
  Helps with UI/UX design decisions, component patterns, 
  accessibility guidelines, design system documentation, and 
  theming for the DevOps Lite Shimeji widget.
applyTo: 'src/components/**/*'
triggerOn:
  - "design"
  - "UI component"
  - "component pattern"
  - "accessibility"
  - "design system"
  - "theme"
  - "color"
  - "layout"
---

# Design System Assistant

Guide for designing UI components and maintaining design consistency in DevOps Lite.

## Design Principles

### 1. Minimal & Functional
- Clean, distraction-free interface
- Focus on developer workflow
- Dark theme (default for dev tools)
- Subtle animations

### 2. Accessibility First
- WCAG 2.1 AA compliance
- Keyboard navigation support
- High contrast modes
- Screen reader friendly

### 3. Responsive Design
- Works on multiple screen sizes
- Floating widget stays responsive
- Overlay modals are centered and scrollable
- Touch-friendly on hybrid devices

---

## Component Structure

All components live in `src/components/` and follow React + TypeScript patterns:

```
src/components/
├─ DebugPanel.tsx          Real-time event monitoring (readonly)
├─ Shimeji.tsx             Main widget container (floating)
├─ FeatureMenu.tsx         Feature selector (tabbed)
├─ modals/
│  ├─ HelpModal.tsx        Help & documentation
│  └─ PathInputModal.tsx   Project folder selector
└─ overlays/
   ├─ DiffViewer.tsx               Code Fixer results
   ├─ SetupStepsOverlay.tsx         Environment Builder results
   ├─ OrganizationPlanOverlay.tsx   File Organizer results
   ├─ CodeFixerAgentOverlay.tsx     Code Fixer agent
   ├─ CodebaseChatOverlay.tsx       Codebase chat
   ├─ DiscussionRoomOverlay.tsx     Discussion room
   └─ FileOrganizerWorkbench.tsx    File organizer workbench
```

---

## Color Palette

### Base Colors
- **Primary**: `#0EA5E9` (sky blue) — Primary actions, highlights
- **Secondary**: `#8B5CF6` (purple) — Secondary actions
- **Success**: `#10B981` (emerald) — Positive feedback
- **Warning**: `#F59E0B` (amber) — Warnings
- **Error**: `#EF4444` (red) — Errors, destructive actions
- **Info**: `#3B82F6` (blue) — Informational

### Neutral Colors
- **Background**: `#0F172A` (dark slate) — Primary background
- **Surface**: `#1E293B` (slate) — Cards, sidebars
- **Muted**: `#64748B` (slate-500) — Disabled, secondary text
- **Border**: `#334155` (slate-700) — Borders, dividers
- **Text**: `#F1F5F9` (slate-100) — Primary text
- **Text Muted**: `#94A3B8` (slate-400) — Secondary text

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Scale
- **H1 (Hero)**: 32px, 600 weight — Page titles
- **H2 (Section)**: 24px, 600 weight — Section headers
- **H3 (Subsection)**: 18px, 600 weight — Subsection headers
- **Body**: 14px, 400 weight — Default text
- **Small**: 12px, 400 weight — Secondary info, help text
- **Code**: `monospace`, 13px — Code snippets, file paths

---

## Spacing Scale

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **2xl**: 32px
- **3xl**: 48px

---

## Component Patterns

### Button
```tsx
// Primary action
<button className="btn btn-primary">Save Changes</button>

// Secondary action
<button className="btn btn-secondary">Cancel</button>

// Danger zone
<button className="btn btn-danger">Delete</button>

// Disabled
<button className="btn btn-primary" disabled>Save</button>
```

### Card
```tsx
<div className="card">
  <div className="card-header">
    <h3>Title</h3>
  </div>
  <div className="card-body">
    Content here
  </div>
</div>
```

### Modal
```tsx
<div className="modal-overlay">
  <div className="modal">
    <div className="modal-header">
      <h2>Modal Title</h2>
      <button className="close-btn">×</button>
    </div>
    <div className="modal-body">
      Content
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary">Cancel</button>
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Overlay (Full-screen)
```tsx
<div className="overlay-backdrop">
  <div className="overlay-container">
    Content here
  </div>
</div>
```

---

## Accessibility Guidelines

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order should follow logical flow
- Escape key closes modals and overlays
- Enter key confirms actions

### Screen Readers
- Use semantic HTML (`<button>`, `<a>`, `<form>`)
- Provide `aria-label` for icon-only buttons
- Use `aria-describedby` for complex content
- Use `role="status"` for dynamic updates (DebugPanel events)

### Color Contrast
- Text on background: minimum 4.5:1 ratio
- UI components: minimum 3:1 ratio
- Do not rely on color alone; use icons + text

### Focus Indicators
- Visible focus outlines on all focusable elements
- Use `:focus-visible` for keyboard focus only
- Outline color: primary color (`#0EA5E9`)

---

## Dark Mode

All components default to dark theme. Light mode (if needed) uses:
- **Background**: `#FFFFFF`
- **Surface**: `#F8FAFC`
- **Text**: `#0F172A`
- **Border**: `#CBD5E1`

---

## Animation Guidelines

### Transitions
- Use `transition: all 0.2s ease` for smooth interactions
- Avoid animations lasting > 300ms unless intentional
- Disable animations for `prefers-reduced-motion`

### Hover States
- Slight color shift on hover
- Subtle shadow increase on cards
- No aggressive animations that distract

---

## File Organization Best Practices

Keep components organized:
1. **One component per file** (unless very tightly coupled)
2. **Styles colocated** (CSS modules or inline styles)
3. **Props interfaces** defined above component
4. **Export at bottom** of file
5. **Comments for complex logic** only

---

## When to Use This Skill

✅ Use when designing new components  
✅ Use when reviewing component styling  
✅ Use when adding accessibility features  
✅ Use when creating design documentation  
✅ Use when theming or updating colors  

❌ Don't use for business logic  
❌ Don't use for API integration  
❌ Don't use for state management  
