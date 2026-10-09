// Core data model. An agency (Subtitled) sets up a Client with a locked BrandKit
// and Templates; the client only edits Design content (text, images, audio).

export type AspectClass = 'square' | 'portrait' | 'story' | 'landscape' | 'banner' | 'skyscraper';

export interface Format {
  id: string;
  name: string;
  group: 'Social' | 'Ads';
  width: number;
  height: number;
}

/** Position and size as fractions (0–1) of the canvas. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ColorToken = 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'textOnPrimary';
export type Enter = 'none' | 'fade' | 'slideUp' | 'slideLeft' | 'scale';
export type FontRole = 'heading' | 'body';

interface BaseEl {
  id: string;
  /** Layout per aspect class. A missing class hides the element at that shape. */
  layouts: Partial<Record<AspectClass, Box>>;
  enter?: Enter;
  /** Seconds before the entrance animation starts (video only). */
  delay?: number;
}

export interface TextEl extends BaseEl {
  type: 'text';
  field: string;
  font: FontRole;
  color: ColorToken;
  /** Largest font size, as a fraction of sqrt(width × height). Text shrinks to fit its box. */
  maxSize: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  uppercase?: boolean;
  lineHeight?: number;
  /** Em fraction, e.g. 0.05 */
  letterSpacing?: number;
}

export interface RectEl extends BaseEl {
  type: 'rect';
  fill: ColorToken;
  radius?: number;
  opacity?: number;
}

export interface ImageEl extends BaseEl {
  type: 'image';
  field: string;
  radius?: number;
  overlay?: { color: ColorToken; opacity: number };
  /** Slow zoom across the video. */
  kenBurns?: boolean;
}

export interface LogoEl extends BaseEl {
  type: 'logo';
  /** Colour of the wordmark fallback when the brand has no logo file. */
  color: ColorToken;
  align?: 'left' | 'center' | 'right';
}

export interface ButtonEl extends BaseEl {
  type: 'button';
  field: string;
  fill: ColorToken;
  color: ColorToken;
  font: FontRole;
  radius?: number;
  uppercase?: boolean;
}

export type El = TextEl | RectEl | ImageEl | LogoEl | ButtonEl;

export interface FieldDef {
  key: string;
  label: string;
  kind: 'text' | 'longtext' | 'image';
  default: string;
  maxChars?: number;
}

export interface Template {
  id: string;
  name: string;
  background: ColorToken;
  fields: FieldDef[];
  elements: El[];
}

export interface FontDef {
  family: string;
  source: 'google' | 'upload';
  weight: number;
  /** For uploaded font files (woff2/woff/ttf/otf). */
  dataUrl?: string;
}

export interface BrandKit {
  colors: Record<ColorToken, string>;
  headingFont: FontDef;
  bodyFont: FontDef;
  logo?: string;
}

export type PlanId = 'essentials' | 'studio';

export interface Client {
  id: string;
  name: string;
  plan: PlanId;
  brand: BrandKit;
  templates: Template[];
}

export interface AudioTrack {
  name: string;
  dataUrl: string;
  volume: number;
  /** Seconds into the track to start from. */
  offset: number;
}

export interface Design {
  id: string;
  clientId: string;
  templateId: string;
  name: string;
  content: Record<string, string>;
  duration: number;
  audio?: AudioTrack;
  updatedAt: number;
}
