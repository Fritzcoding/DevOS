import { bg, footer, title, panel, C, bullet } from "./common.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "Problem to product", "DevOS Lite compresses scattered developer chores into one guided desktop loop.");
  panel(slide, ctx, 80, 220, 500, 330, "#102832");
  panel(slide, ctx, 700, 220, 500, 330, "#F7FBFC");
  ctx.addText(slide, { text: "Before", x: 110, y: 250, w: 180, h: 32, fontSize: 24, bold: true, color: C.red });
  bullet(slide, ctx, "Switch between editor, terminal, docs, file explorer", 112, 306, 400);
  bullet(slide, ctx, "Manual setup steps are easy to miss", 112, 356, 400);
  bullet(slide, ctx, "Bulk file cleanup can damage project structure", 112, 406, 400);
  bullet(slide, ctx, "AI output still needs safety checks", 112, 456, 400);
  ctx.addText(slide, { text: "After", x: 730, y: 250, w: 180, h: 32, fontSize: 24, bold: true, color: C.teal });
  const dark = C.darkText;
  ctx.addText(slide, { text: "- Floating Shimeji entry point stays available", x: 732, y: 306, w: 410, h: 28, fontSize: 17, color: dark });
  ctx.addText(slide, { text: "- AI setup, code repair, and file planning in one app", x: 732, y: 356, w: 410, h: 28, fontSize: 17, color: dark });
  ctx.addText(slide, { text: "- Preview-first operations before file changes", x: 732, y: 406, w: 410, h: 28, fontSize: 17, color: dark });
  ctx.addText(slide, { text: "- Rollback metadata protects applied moves", x: 732, y: 456, w: 410, h: 28, fontSize: 17, color: dark });
  ctx.addShape(slide, { x: 612, y: 366, w: 46, h: 6, fill: C.cyan });
  ctx.addShape(slide, { x: 650, y: 354, w: 22, h: 22, fill: C.cyan, geometry: "triangle" });
  footer(slide, ctx, 2);
  return slide;
}
