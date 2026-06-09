import { bg, footer, title, panel, C } from "./common.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "Execution", "Member 1 owned the core engineering path; the rest of the team supported around it.");
  const phases = [
    ["Week 1", "Concept, stack choice, Electron/React shell"],
    ["Week 2", "AI routing, settings, first-run setup"],
    ["Week 3", "Code Fixer and Environment Builder"],
    ["Week 4", "File Organizer safety, preview/apply/rollback"],
    ["Week 5", "UI polish, tests, Java optional backend, demo prep"],
  ];
  phases.forEach(([wk, txt], i) => {
    const x = 80 + i * 220;
    ctx.addShape(slide, { x, y: 260, w: 150, h: 8, fill: i < 4 ? C.cyan : C.gold });
    ctx.addText(slide, { text: wk, x, y: 284, w: 150, h: 24, fontSize: 18, bold: true, color: C.text });
    ctx.addText(slide, { text: txt, x, y: 316, w: 170, h: 58, fontSize: 13, color: C.soft });
  });
  const roles = [
    ["Member 1: Lead engineer / presenter", "Architecture, Electron IPC, AI routing, core features, safety engine, tests, demo flow", "70%"],
    ["Member 2: Support", "Light UI/content review, small documentation support, demo checklist help", "20%"],
    ["Member 3: Minimal support", "Basic slide/demo timing support and final review", "10%"],
  ];
  roles.forEach(([name, work, pct], i) => {
    const y = 438 + i * 70;
    panel(slide, ctx, 78, y, 1060, 50, i === 0 ? "#DDF2F6" : "#102832");
    ctx.addText(slide, { text: name, x: 98, y: y + 12, w: 310, h: 24, fontSize: 17, bold: true, color: i === 0 ? C.darkText : C.text });
    ctx.addText(slide, { text: work, x: 430, y: y + 13, w: 570, h: 24, fontSize: 13, color: i === 0 ? "#47626B" : C.soft });
    ctx.addText(slide, { text: pct, x: 1042, y: y + 10, w: 72, h: 28, fontSize: 21, bold: true, align: "right", color: i === 0 ? C.teal : C.gold });
  });
  footer(slide, ctx, 6);
  return slide;
}
