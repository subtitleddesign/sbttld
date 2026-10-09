import type { BrandKit, FontDef } from './types';

// Images and fonts load asynchronously; listeners re-render previews once they arrive.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

export function onAssetsChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

const images = new Map<string, HTMLImageElement>();

/** Returns the image if it has loaded, otherwise starts loading it and returns undefined. */
export function getImage(src: string): HTMLImageElement | undefined {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.onload = notify;
    img.src = src;
    images.set(src, img);
  }
  return img.complete && img.naturalWidth ? img : undefined;
}

export async function preloadImages(srcs: (string | undefined)[]): Promise<void> {
  await Promise.all(
    srcs.filter((s): s is string => !!s).map((s) => {
      getImage(s);
      return images.get(s)!.decode().catch(() => undefined);
    }),
  );
}

const fonts = new Map<string, Promise<void>>();

function loadFont(f: FontDef): Promise<void> {
  const key = `${f.source}|${f.family}|${f.weight}|${f.dataUrl?.length ?? 0}`;
  let p = fonts.get(key);
  if (!p) {
    p = (async () => {
      if (f.source === 'upload' && f.dataUrl) {
        const face = new FontFace(f.family, `url(${f.dataUrl})`, { weight: String(f.weight) });
        document.fonts.add(await face.load());
      } else {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family)}:wght@${f.weight}&display=block`;
        await new Promise((res) => {
          link.onload = link.onerror = res;
          document.head.appendChild(link);
        });
        await document.fonts.load(`${f.weight} 40px "${f.family}"`);
      }
      notify();
    })().catch((e) => console.warn(`Font "${f.family}" failed to load`, e));
    fonts.set(key, p);
  }
  return p;
}

export function loadBrandFonts(brand: BrandKit): Promise<void> {
  return Promise.all([loadFont(brand.headingFont), loadFont(brand.bodyFont)]).then(() => undefined);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}
