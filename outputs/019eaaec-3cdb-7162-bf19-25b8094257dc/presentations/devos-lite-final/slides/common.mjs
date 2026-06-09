import path from "node:path";
import { fileURLToPath } from "node:url";

export const C = {
  ink: "#08151A",
  ink2: "#0F232B",
  panel: "#F7FBFC",
  soft: "#DDF2F6",
  cyan: "#1FB7D8",
  teal: "#21B8A6",
  gold: "#F2B84B",
  red: "#F07167",
  text: "#F7FBFC",
  darkText: "#10212B",
  muted: "#8EA3AA",
  line: "#376674",
};

const here = path.dirname(fileURLToPath(import.meta.url));
export const logoPath = path.resolve(here, "../../../../../assets/Devos_logo.png");

export function bg(slide, ctx) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: C.ink });
  ctx.addShape(slide, { x: 0, y: 0, w: 16, h: ctx.H, fill: C.cyan });
}

export function footer(slide, ctx, n) {
  ctx.addText(slide, {
    text: "DevOS Lite final presentation",
    x: 42,
    y: 682,
    w: 420,
    h: 20,
    fontSize: 11,
    color: C.muted,
  });
  ctx.addText(slide, {
    text: String(n).padStart(2, "0"),
    x: 1190,
    y: 674,
    w: 48,
    h: 26,
    fontSize: 14,
    bold: true,
    align: "right",
    color: C.muted,
  });
}

export function title(slide, ctx, kicker, claim) {
  ctx.addText(slide, {
    text: kicker.toUpperCase(),
    x: 64,
    y: 48,
    w: 380,
    h: 22,
    fontSize: 12,
    bold: true,
    color: C.cyan,
  });
  ctx.addText(slide, {
    text: claim,
    x: 64,
    y: 82,
    w: 970,
    h: 92,
    fontSize: 38,
    bold: true,
    typeface: ctx.fonts.title,
    color: C.text,
  });
}

export function pill(slide, ctx, text, x, y, w, fill = C.ink2, color = C.text) {
  ctx.addText(slide, {
    text,
    x,
    y,
    w,
    h: 34,
    fontSize: 15,
    bold: true,
    align: "center",
    valign: "mid",
    fill,
    color,
    insets: { left: 8, right: 8, top: 4, bottom: 4 },
  });
}

export function panel(slide, ctx, x, y, w, h, fill = C.panel) {
  ctx.addShape(slide, {
    x,
    y,
    w,
    h,
    fill,
    line: { style: "solid", fill: "#C8E6ED", width: 1 },
  });
}

export function label(slide, ctx, text, x, y, w, color = C.muted) {
  ctx.addText(slide, { text, x, y, w, h: 22, fontSize: 12, bold: true, color });
}

export function bullet(slide, ctx, text, x, y, w, color = C.text) {
  ctx.addText(slide, { text: "- " + text, x, y, w, h: 28, fontSize: 17, color });
}

export function connector(slide, ctx, x1, y1, x2, y2, color = C.cyan) {
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
  if (horizontal) {
    ctx.addShape(slide, { x: Math.min(x1, x2), y: y1 - 1, w: Math.abs(x2 - x1), h: 2, fill: color });
    ctx.addShape(slide, { x: x2 - 6, y: y2 - 5, w: 10, h: 10, fill: color, geometry: "triangle" });
  } else {
    ctx.addShape(slide, { x: x1 - 1, y: Math.min(y1, y2), w: 2, h: Math.abs(y2 - y1), fill: color });
  }
}
