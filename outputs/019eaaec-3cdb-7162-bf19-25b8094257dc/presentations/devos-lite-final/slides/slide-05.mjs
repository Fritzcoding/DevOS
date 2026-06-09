import { bg, footer, title, panel, C, connector } from "./common.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "Safety", "The strongest engineering decision is preview-first automation with rollback instead of blind file mutation.");
  const steps = [
    ["Scan", "Read project files and ignore protected paths"],
    ["Plan", "AI or heuristic plan generates proposed moves"],
    ["Preview", "User sees risk, moves, and destinations first"],
    ["Apply", "Executor creates parent dirs and moves files safely"],
    ["Rollback", "JSONL batch metadata restores original paths"],
  ];
  steps.forEach(([name, desc], i) => {
    const x = 80 + i * 230;
    panel(slide, ctx, x, 260, 178, 146, i === 2 ? "#DDF2F6" : "#F7FBFC");
    ctx.addText(slide, { text: name, x: x + 16, y: 282, w: 140, h: 30, fontSize: 22, bold: true, color: C.darkText });
    ctx.addText(slide, { text: desc, x: x + 16, y: 324, w: 142, h: 62, fontSize: 13, color: "#47626B" });
    if (i < steps.length - 1) connector(slide, ctx, x + 178, 333, x + 230, 333, C.cyan);
  });
  ctx.addText(slide, { text: "Guardrails implemented", x: 86, y: 482, w: 300, h: 26, fontSize: 20, bold: true, color: C.cyan });
  const guards = [
    "Protected paths: .git, node_modules, lockfiles, .env*, build outputs",
    "Dry-run tests confirm preview does not mutate source files",
    "Apply + rollback tests verify reversible organization",
    "User-facing file count excludes internal recovery folders",
  ];
  guards.forEach((g, i) => ctx.addText(slide, { text: "- " + g, x: 88, y: 522 + i * 28, w: 970, h: 24, fontSize: 16, color: C.soft }));
  footer(slide, ctx, 5);
  return slide;
}
