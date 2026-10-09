import type { AspectClass, Box, Client, FieldDef, Template } from './types';

type Boxes = Partial<Record<AspectClass, [number, number, number, number]>>;

/** Shorthand: { square: [x, y, w, h], ... } → layouts. */
function L(boxes: Boxes): Partial<Record<AspectClass, Box>> {
  const out: Partial<Record<AspectClass, Box>> = {};
  for (const [k, [x, y, w, h]] of Object.entries(boxes) as [AspectClass, [number, number, number, number]][]) {
    out[k] = { x, y, w, h };
  }
  return out;
}

const fields: FieldDef[] = [
  { key: 'headline', label: 'Headline', kind: 'text', default: 'Launch something extraordinary', maxChars: 60 },
  { key: 'subhead', label: 'Supporting line', kind: 'longtext', default: 'The new season collection, designed for the bold.', maxChars: 120 },
  { key: 'cta', label: 'Button', kind: 'text', default: 'Shop now', maxChars: 18 },
  { key: 'image', label: 'Image', kind: 'image', default: '' },
];

// Vertical (9:16) layouts keep text out of the top 14% and bottom 20%,
// where Stories, Reels and TikTok draw their own UI.

export const HERO: Template = {
  id: 'hero',
  name: 'Hero Image',
  background: 'primary',
  fields,
  elements: [
    {
      id: 'photo', type: 'image', field: 'image', enter: 'fade', kenBurns: true,
      overlay: { color: 'primary', opacity: 0.75 },
      layouts: L({ square: [0, 0, 1, 1], portrait: [0, 0, 1, 1], story: [0, 0, 1, 1], landscape: [0, 0, 1, 1], banner: [0, 0, 1, 1], skyscraper: [0, 0, 1, 1] }),
    },
    {
      id: 'logo', type: 'logo', color: 'textOnPrimary', enter: 'fade', delay: 0.2,
      layouts: L({ square: [0.07, 0.07, 0.25, 0.07], portrait: [0.07, 0.06, 0.25, 0.06], story: [0.08, 0.15, 0.3, 0.04], landscape: [0.05, 0.08, 0.18, 0.1], banner: [0.02, 0.2, 0.12, 0.6], skyscraper: [0.1, 0.04, 0.8, 0.07] }),
    },
    {
      id: 'headline', type: 'text', field: 'headline', font: 'heading', color: 'textOnPrimary', maxSize: 0.1, valign: 'bottom', lineHeight: 1.05, enter: 'slideUp', delay: 0.4,
      layouts: L({ square: [0.07, 0.42, 0.86, 0.32], portrait: [0.07, 0.48, 0.86, 0.27], story: [0.08, 0.38, 0.84, 0.24], landscape: [0.05, 0.3, 0.62, 0.4], banner: [0.16, 0.12, 0.6, 0.76], skyscraper: [0.08, 0.16, 0.84, 0.36] }),
    },
    {
      id: 'subhead', type: 'text', field: 'subhead', font: 'body', color: 'textOnPrimary', maxSize: 0.032, enter: 'slideUp', delay: 0.7,
      layouts: L({ square: [0.07, 0.76, 0.62, 0.1], portrait: [0.07, 0.77, 0.7, 0.08], story: [0.08, 0.635, 0.84, 0.06], landscape: [0.05, 0.72, 0.55, 0.14], skyscraper: [0.08, 0.55, 0.84, 0.18] }),
    },
    {
      id: 'cta', type: 'button', field: 'cta', font: 'body', fill: 'accent', color: 'primary', radius: 0.5, uppercase: true, enter: 'scale', delay: 1,
      layouts: L({ square: [0.07, 0.88, 0.3, 0.065], portrait: [0.07, 0.88, 0.3, 0.055], story: [0.08, 0.72, 0.45, 0.045], landscape: [0.72, 0.74, 0.23, 0.13], banner: [0.79, 0.22, 0.19, 0.56], skyscraper: [0.1, 0.84, 0.8, 0.07] }),
    },
  ],
};

export const BOLD: Template = {
  id: 'bold',
  name: 'Bold Type',
  background: 'primary',
  fields: fields.filter((f) => f.kind !== 'image'),
  elements: [
    {
      id: 'bar', type: 'rect', fill: 'accent', enter: 'slideLeft',
      layouts: L({ square: [0.07, 0.1, 0.12, 0.012], portrait: [0.07, 0.1, 0.12, 0.01], story: [0.08, 0.16, 0.15, 0.006], landscape: [0.05, 0.13, 0.07, 0.016], skyscraper: [0.1, 0.07, 0.25, 0.006] }),
    },
    {
      id: 'headline', type: 'text', field: 'headline', font: 'heading', color: 'textOnPrimary', maxSize: 0.13, lineHeight: 1, enter: 'slideUp', delay: 0.2,
      layouts: L({ square: [0.07, 0.15, 0.86, 0.5], portrait: [0.07, 0.14, 0.86, 0.5], story: [0.08, 0.19, 0.84, 0.4], landscape: [0.05, 0.2, 0.6, 0.5], banner: [0.16, 0.12, 0.6, 0.76], skyscraper: [0.1, 0.1, 0.8, 0.4] }),
    },
    {
      id: 'subhead', type: 'text', field: 'subhead', font: 'body', color: 'textOnPrimary', maxSize: 0.032, enter: 'fade', delay: 0.6,
      layouts: L({ square: [0.07, 0.68, 0.7, 0.1], portrait: [0.07, 0.67, 0.75, 0.1], story: [0.08, 0.6, 0.84, 0.08], landscape: [0.05, 0.72, 0.55, 0.14], skyscraper: [0.1, 0.52, 0.8, 0.18] }),
    },
    {
      id: 'logo', type: 'logo', color: 'textOnPrimary', enter: 'fade', delay: 0.8,
      layouts: L({ square: [0.07, 0.86, 0.22, 0.07], portrait: [0.07, 0.88, 0.22, 0.06], story: [0.08, 0.725, 0.3, 0.04], landscape: [0.72, 0.12, 0.23, 0.12], banner: [0.02, 0.2, 0.12, 0.6], skyscraper: [0.1, 0.9, 0.8, 0.06] }),
    },
    {
      id: 'cta', type: 'button', field: 'cta', font: 'body', fill: 'accent', color: 'primary', radius: 0.2, uppercase: true, enter: 'scale', delay: 1,
      layouts: L({ square: [0.63, 0.86, 0.3, 0.07], portrait: [0.63, 0.88, 0.3, 0.06], story: [0.52, 0.72, 0.4, 0.045], landscape: [0.72, 0.74, 0.23, 0.13], banner: [0.79, 0.22, 0.19, 0.56], skyscraper: [0.1, 0.78, 0.8, 0.08] }),
    },
  ],
};

export const SPLIT: Template = {
  id: 'split',
  name: 'Split Panel',
  background: 'background',
  fields,
  elements: [
    {
      id: 'photo', type: 'image', field: 'image', enter: 'fade', kenBurns: true,
      layouts: L({ square: [0, 0, 1, 0.55], portrait: [0, 0, 1, 0.55], story: [0, 0, 1, 0.5], landscape: [0, 0, 0.5, 1], banner: [0, 0, 0.22, 1], skyscraper: [0, 0, 1, 0.35] }),
    },
    {
      id: 'rule', type: 'rect', fill: 'accent', enter: 'slideLeft', delay: 0.3,
      layouts: L({ square: [0, 0.55, 1, 0.01], portrait: [0, 0.55, 1, 0.008], story: [0, 0.5, 1, 0.005], landscape: [0.5, 0, 0.008, 1], banner: [0.22, 0, 0.006, 1], skyscraper: [0, 0.35, 1, 0.006] }),
    },
    {
      id: 'logo', type: 'logo', color: 'text', enter: 'fade', delay: 0.4,
      layouts: L({ square: [0.71, 0.61, 0.22, 0.05], portrait: [0.71, 0.61, 0.22, 0.04], story: [0.08, 0.77, 0.3, 0.03], landscape: [0.55, 0.08, 0.2, 0.08], skyscraper: [0.1, 0.92, 0.8, 0.05] }),
    },
    {
      id: 'headline', type: 'text', field: 'headline', font: 'heading', color: 'text', maxSize: 0.08, lineHeight: 1.05, enter: 'slideUp', delay: 0.5,
      layouts: L({ square: [0.07, 0.6, 0.62, 0.2], portrait: [0.07, 0.6, 0.62, 0.2], story: [0.08, 0.53, 0.84, 0.13], landscape: [0.55, 0.2, 0.4, 0.42], banner: [0.26, 0.12, 0.5, 0.76], skyscraper: [0.1, 0.38, 0.8, 0.26] }),
    },
    {
      id: 'subhead', type: 'text', field: 'subhead', font: 'body', color: 'text', maxSize: 0.028, enter: 'fade', delay: 0.8,
      layouts: L({ square: [0.07, 0.81, 0.52, 0.12], portrait: [0.07, 0.81, 0.52, 0.11], story: [0.08, 0.665, 0.84, 0.045], landscape: [0.55, 0.63, 0.4, 0.14], skyscraper: [0.1, 0.65, 0.8, 0.13] }),
    },
    {
      id: 'cta', type: 'button', field: 'cta', font: 'body', fill: 'primary', color: 'textOnPrimary', radius: 0.5, uppercase: true, enter: 'scale', delay: 1,
      layouts: L({ square: [0.63, 0.84, 0.3, 0.07], portrait: [0.63, 0.85, 0.3, 0.06], story: [0.08, 0.72, 0.45, 0.04], landscape: [0.55, 0.8, 0.25, 0.11], banner: [0.79, 0.22, 0.19, 0.56], skyscraper: [0.1, 0.8, 0.8, 0.07] }),
    },
  ],
};

export const TEMPLATE_LIBRARY: Template[] = [HERO, BOLD, SPLIT];

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'aurora',
    name: 'Aurora Skincare',
    plan: 'studio',
    brand: {
      colors: { primary: '#1F3D36', secondary: '#8FA89B', accent: '#D9B88F', background: '#F6F1EA', text: '#1F3D36', textOnPrimary: '#F6F1EA' },
      headingFont: { family: 'Playfair Display', source: 'google', weight: 700 },
      bodyFont: { family: 'Inter', source: 'google', weight: 500 },
    },
    templates: clone(TEMPLATE_LIBRARY),
  },
  {
    id: 'volt',
    name: 'VOLT Fitness',
    plan: 'essentials',
    brand: {
      colors: { primary: '#0B0B0F', secondary: '#3A3A48', accent: '#D4FF3A', background: '#F2F2F2', text: '#0B0B0F', textOnPrimary: '#FFFFFF' },
      headingFont: { family: 'Anton', source: 'google', weight: 400 },
      bodyFont: { family: 'Inter', source: 'google', weight: 600 },
    },
    templates: clone(TEMPLATE_LIBRARY),
  },
];
