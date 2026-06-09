import { bg, footer, title, panel, C } from "./common.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "Demo handoff", "The live demo should prove the product loop in 90 seconds.");
  const items = [
    ["0:00-0:15", "Open Shimeji and show AI Settings", "Cloud/local routing is configurable"],
    ["0:15-0:45", "Run File Organizer preview on sample clutter", "Preview before apply, clean destinations"],
    ["0:45-1:05", "Show apply/rollback status", "Automation is reversible"],
    ["1:05-1:25", "Open Environment Builder or Code Fixer", "Same assistant handles setup or repair"],
    ["1:25-1:30", "Close with architecture sentence", "Safe desktop AI, not just a chatbot"],
  ];
  items.forEach(([time, action, proof], i) => {
    const y = 224 + i * 70;
    panel(slide, ctx, 84, y, 1090, 50, i === 1 ? "#DDF2F6" : "#102832");
    ctx.addText(slide, { text: time, x: 106, y: y + 13, w: 110, h: 24, fontSize: 16, bold: true, color: i === 1 ? C.darkText : C.gold });
    ctx.addText(slide, { text: action, x: 250, y: y + 12, w: 410, h: 24, fontSize: 17, bold: true, color: i === 1 ? C.darkText : C.text });
    ctx.addText(slide, { text: proof, x: 700, y: y + 13, w: 390, h: 24, fontSize: 14, color: i === 1 ? "#47626B" : C.soft });
  });
  ctx.addText(slide, { text: "Closing line: DevOS Lite is a safe AI workflow layer for local developer work.", x: 90, y: 608, w: 900, h: 32, fontSize: 21, bold: true, color: C.cyan });
  footer(slide, ctx, 7);
  return slide;
}
