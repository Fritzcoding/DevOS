import { bg, footer, title, panel, C } from "./common.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "Feature proof", "The demo focuses on implemented workflows, not a mock interface.");
  const headers = ["Workflow", "What it does", "Proof in codebase", "Demo value"];
  const xs = [74, 300, 620, 930];
  const ws = [190, 280, 270, 250];
  headers.forEach((h, i) => ctx.addText(slide, { text: h, x: xs[i], y: 210, w: ws[i], h: 24, fontSize: 13, bold: true, color: C.cyan }));
  const rows = [
    ["Code Fixer", "AI-assisted repair with project-aware flow", "CodeFixerAgentOverlay + feature service", "Show fix suggestion flow"],
    ["Environment Builder", "Scans package files and setup requirements", "detectEnv IPC + scanProject tests", "Generate setup steps"],
    ["File Organizer", "Preview, dry-run, apply, rollback", "FileOrganizerService + SafeFileOperationExecutor", "Move messy files safely"],
    ["AI Settings", "Switch cloud API or local Ollama model", "AIRouter, OllamaClient, API client", "Show local/cloud routing"],
  ];
  rows.forEach((row, r) => {
    const y = 250 + r * 78;
    panel(slide, ctx, 64, y - 10, 1152, 66, r % 2 === 0 ? "#102832" : "#0D2027");
    row.forEach((cell, i) => ctx.addText(slide, {
      text: cell,
      x: xs[i],
      y: y + 3,
      w: ws[i],
      h: 34,
      fontSize: i === 0 ? 18 : 14,
      bold: i === 0,
      color: i === 0 ? C.text : C.soft,
      insets: { left: 0, right: 6, top: 0, bottom: 0 },
    }));
  });
  ctx.addText(slide, { text: "Compact demo order: AI Settings -> File Organizer -> Env Builder -> Code Fixer.", x: 70, y: 612, w: 780, h: 28, fontSize: 18, bold: true, color: C.gold });
  footer(slide, ctx, 4);
  return slide;
}
