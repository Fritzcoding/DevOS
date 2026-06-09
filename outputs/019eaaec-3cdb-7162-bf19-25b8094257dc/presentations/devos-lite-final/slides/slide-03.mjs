import { bg, footer, title, panel, C, connector } from "./common.mjs";

function node(slide, ctx, text, sub, x, y, w, h, fill) {
  const isLight = fill === "#F7FBFC" || fill === "#DDF2F6";
  panel(slide, ctx, x, y, w, h, fill);
  ctx.addText(slide, { text, x: x + 16, y: y + 14, w: w - 32, h: 28, fontSize: 18, bold: true, color: isLight ? C.darkText : C.text });
  ctx.addText(slide, { text: sub, x: x + 16, y: y + 48, w: w - 32, h: h - 72, fontSize: 13, color: isLight ? "#49616A" : C.muted });
}

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "Architecture", "The system keeps UI, privileged operations, AI routing, and file mutation behind clear boundaries.");
  node(slide, ctx, "React UI", "Shimeji, feature menu, overlays, settings", 70, 224, 190, 116, "#F7FBFC");
  node(slide, ctx, "Preload IPC", "Typed safe bridge: window.electronAPI", 306, 224, 190, 116, "#DDF2F6");
  node(slide, ctx, "Electron main", "IPC handlers, orchestration, tray/window control", 542, 224, 210, 116, "#F7FBFC");
  node(slide, ctx, "Feature modules", "Code Fixer, Env Builder, Organizer, Chat", 798, 224, 210, 116, "#DDF2F6");
  node(slide, ctx, "System layer", "Filesystem, clipboard, rollback logs, optional Java", 1054, 224, 170, 116, "#F7FBFC");
  connector(slide, ctx, 260, 282, 306, 282);
  connector(slide, ctx, 496, 282, 542, 282);
  connector(slide, ctx, 752, 282, 798, 282);
  connector(slide, ctx, 1008, 282, 1054, 282);
  node(slide, ctx, "AI Router", "Cloud APIs or local Ollama; same app workflows", 400, 430, 270, 100, "#102832");
  node(slide, ctx, "Safety engine", "Preview, protected paths, apply, rollback", 735, 430, 270, 100, "#102832");
  connector(slide, ctx, 647, 340, 535, 430, C.gold);
  connector(slide, ctx, 903, 340, 870, 430, C.gold);
  ctx.addText(slide, { text: "Key design choice: renderer never directly owns Node/Electron filesystem power.", x: 70, y: 590, w: 930, h: 30, fontSize: 19, bold: true, color: C.cyan });
  footer(slide, ctx, 3);
  return slide;
}
