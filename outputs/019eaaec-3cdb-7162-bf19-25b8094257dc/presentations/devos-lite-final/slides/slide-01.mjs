import { bg, footer, logoPath, C, pill } from "./common.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  await ctx.addImage(slide, { path: logoPath, x: 72, y: 62, w: 150, h: 150, fit: "cover", alt: "DevOS Lite logo" });
  ctx.addText(slide, { text: "DevOS Lite", x: 250, y: 68, w: 520, h: 58, fontSize: 48, bold: true, typeface: ctx.fonts.title, color: C.text });
  ctx.addText(slide, { text: "A floating AI desktop assistant for code repair, environment setup, and safe project organization.", x: 250, y: 138, w: 760, h: 72, fontSize: 24, color: C.soft });
  ctx.addShape(slide, { x: 72, y: 286, w: 1138, h: 2, fill: C.line });
  const metrics = [
    ["5 min", "presentation target"],
    ["90 sec", "live demo"],
    ["3 workflows", "fix, setup, organize"],
    ["Cloud + Local", "AI routing"],
  ];
  metrics.forEach(([value, label], i) => {
    const x = 78 + i * 280;
    ctx.addText(slide, { text: value, x, y: 340, w: 230, h: 44, fontSize: 33, bold: true, color: i === 3 ? C.gold : C.cyan });
    ctx.addText(slide, { text: label, x, y: 390, w: 230, h: 28, fontSize: 16, color: C.muted });
  });
  pill(slide, ctx, "Electron", 84, 512, 150, C.ink2);
  pill(slide, ctx, "React + TypeScript", 256, 512, 220, C.ink2);
  pill(slide, ctx, "IPC safety boundary", 498, 512, 230, C.ink2);
  pill(slide, ctx, "Ollama / Cloud AI", 750, 512, 230, C.ink2);
  pill(slide, ctx, "Rollback-safe FS ops", 1002, 512, 190, C.ink2);
  footer(slide, ctx, 1);
  return slide;
}
