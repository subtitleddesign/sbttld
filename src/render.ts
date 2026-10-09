import { getImage } from './assets';
import { aspectClass } from './formats';
import type { BrandKit, El, Enter, FontDef, FontRole, Template } from './types';

export interface RenderInput {
  template: Template;
  brand: BrandKit;
  clientName: string;
  content: Record<string, string>;
  width: number;
  height: number;
  /** Seconds into the animation. Omit for the final, static frame (PNG export). */
  t?: number;
  duration?: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ENTER_SECONDS = 0.7;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

export function resolveContent(template: Template, content: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of template.fields) out[f.key] = content[f.key] ?? f.default;
  return out;
}

export function render(ctx: CanvasRenderingContext2D, inp: RenderInput): void {
  const { template, brand, width: W, height: H, t } = inp;
  const cls = aspectClass(W, H);
  const ref = Math.sqrt(W * H);
  const content = resolveContent(template, inp.content);

  ctx.save();
  ctx.fillStyle = brand.colors[template.background];
  ctx.fillRect(0, 0, W, H);

  for (const el of template.elements) {
    const b = el.layouts[cls];
    if (!b) continue;
    const box = { x: b.x * W, y: b.y * H, w: b.w * W, h: b.h * H };
    const p = t === undefined ? 1 : easeOut(clamp01((t - (el.delay ?? 0)) / ENTER_SECONDS));
    if (p <= 0) continue;
    ctx.save();
    applyEnter(ctx, el.enter ?? 'fade', p, box, ref);
    drawElement(ctx, el, box, inp, content, ref);
    ctx.restore();
  }
  ctx.restore();
}

function applyEnter(ctx: CanvasRenderingContext2D, enter: Enter, p: number, box: Rect, ref: number) {
  if (enter === 'none' || p >= 1) return;
  ctx.globalAlpha *= p;
  const d = (1 - p) * ref * 0.04;
  if (enter === 'slideUp') ctx.translate(0, d);
  else if (enter === 'slideLeft') ctx.translate(-d, 0);
  else if (enter === 'scale') {
    const s = 0.9 + 0.1 * p;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
  }
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: El,
  box: Rect,
  inp: RenderInput,
  content: Record<string, string>,
  ref: number,
) {
  const { brand } = inp;
  const c = brand.colors;
  switch (el.type) {
    case 'rect': {
      ctx.globalAlpha *= el.opacity ?? 1;
      ctx.fillStyle = c[el.fill];
      roundRect(ctx, box, (el.radius ?? 0) * Math.min(box.w, box.h));
      ctx.fill();
      return;
    }
    case 'image': {
      ctx.save();
      roundRect(ctx, box, (el.radius ?? 0) * Math.min(box.w, box.h));
      ctx.clip();
      const src = content[el.field];
      const img = src ? getImage(src) : undefined;
      const zoom = el.kenBurns && inp.t !== undefined && inp.duration ? 1 + 0.08 * clamp01(inp.t / inp.duration) : 1;
      if (img) drawCover(ctx, img, box, zoom);
      else drawPlaceholder(ctx, box, c.secondary, c.primary);
      if (el.overlay) {
        const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
        g.addColorStop(0, rgba(c[el.overlay.color], el.overlay.opacity * 0.35));
        g.addColorStop(1, rgba(c[el.overlay.color], el.overlay.opacity));
        ctx.fillStyle = g;
        ctx.fillRect(box.x, box.y, box.w, box.h);
      }
      ctx.restore();
      return;
    }
    case 'logo': {
      const img = brand.logo ? getImage(brand.logo) : undefined;
      if (img) {
        const s = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        const align = el.align ?? 'left';
        const x = align === 'left' ? box.x : align === 'right' ? box.x + box.w - w : box.x + (box.w - w) / 2;
        ctx.drawImage(img, x, box.y + (box.h - h) / 2, w, h);
      } else {
        drawText(ctx, inp.clientName, box, {
          font: brand.headingFont,
          color: c[el.color],
          maxPx: box.h,
          align: el.align ?? 'left',
          valign: 'middle',
          maxLines: 1,
        });
      }
      return;
    }
    case 'text': {
      const text = content[el.field] ?? '';
      drawText(ctx, el.uppercase ? text.toUpperCase() : text, box, {
        font: fontFor(brand, el.font),
        color: c[el.color],
        maxPx: el.maxSize * ref,
        align: el.align ?? 'left',
        valign: el.valign ?? 'top',
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing,
      });
      return;
    }
    case 'button': {
      const text = content[el.field] ?? '';
      if (!text.trim()) return;
      // Keep a pill shape when the slot is squat (e.g. billboard banners).
      const bh = Math.min(box.h, box.w * 0.32);
      box = { ...box, y: box.y + (box.h - bh) / 2, h: bh };
      ctx.fillStyle = c[el.fill];
      roundRect(ctx, box, (el.radius ?? 0) * Math.min(box.w, box.h));
      ctx.fill();
      const padX = Math.min(box.h * 0.6, box.w * 0.1);
      const inner = { x: box.x + padX, y: box.y + box.h * 0.25, w: box.w - padX * 2, h: box.h * 0.5 };
      drawText(ctx, el.uppercase ? text.toUpperCase() : text, inner, {
        font: fontFor(brand, el.font),
        color: c[el.color],
        maxPx: inner.h,
        align: 'center',
        valign: 'middle',
        maxLines: 1,
        letterSpacing: el.uppercase ? 0.06 : 0,
      });
      return;
    }
  }
}

const fontFor = (brand: BrandKit, role: FontRole) => (role === 'heading' ? brand.headingFont : brand.bodyFont);

interface TextOpts {
  font: FontDef;
  color: string;
  maxPx: number;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
}

function setFont(ctx: CanvasRenderingContext2D, font: FontDef, size: number, letterSpacing: number) {
  ctx.font = `${font.weight} ${size}px "${font.family}", system-ui, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * letterSpacing}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxW) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Draws text at the largest size (≤ maxPx) at which it fits inside the box. */
function drawText(ctx: CanvasRenderingContext2D, text: string, box: Rect, o: TextOpts) {
  if (!text.trim()) return;
  const lh = o.lineHeight ?? 1.2;
  const ls = o.letterSpacing ?? 0;
  const fits = (size: number) => {
    setFont(ctx, o.font, size, ls);
    const lines = wrap(ctx, text, box.w);
    if (o.maxLines && lines.length > o.maxLines) return null;
    if (lines.length * size * lh > box.h) return null;
    if (lines.some((l) => ctx.measureText(l).width > box.w)) return null;
    return lines;
  };

  let lo = 4;
  let hi = Math.max(lo, o.maxPx);
  let best = fits(lo) ?? [text];
  let size = lo;
  for (let i = 0; i < 14 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    const lines = fits(mid);
    if (lines) {
      lo = mid;
      best = lines;
      size = mid;
    } else hi = mid;
  }

  setFont(ctx, o.font, size, ls);
  ctx.fillStyle = o.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = o.align;
  const lineH = size * lh;
  const total = best.length * lineH;
  const top = o.valign === 'top' ? box.y : o.valign === 'bottom' ? box.y + box.h - total : box.y + (box.h - total) / 2;
  const x = o.align === 'left' ? box.x : o.align === 'right' ? box.x + box.w : box.x + box.w / 2;
  best.forEach((line, i) => ctx.fillText(line, x, top + lineH * (i + 0.5)));
}

function roundRect(ctx: CanvasRenderingContext2D, b: Rect, r: number) {
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, Math.min(r, b.w / 2, b.h / 2));
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, b: Rect, zoom: number) {
  const s = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight) * zoom;
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.drawImage(img, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, b: Rect, from: string, to: string) {
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  const r = Math.max(b.w, b.h);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(b.x + b.w * 0.8, b.y + b.h * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(b.x + b.w * 0.15, b.y + b.h * 0.9, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, (ch) => ch + ch) : h;
  const n = parseInt(full.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
