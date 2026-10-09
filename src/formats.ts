import type { AspectClass, Format } from './types';

export const FORMATS: Format[] = [
  { id: 'square', name: 'Instagram / Facebook Post', group: 'Social', width: 1080, height: 1080 },
  { id: 'portrait', name: 'Instagram Portrait', group: 'Social', width: 1080, height: 1350 },
  { id: 'vertical', name: 'Stories / Reels / TikTok / Shorts', group: 'Social', width: 1080, height: 1920 },
  { id: 'pinterest', name: 'Pinterest Pin', group: 'Social', width: 1000, height: 1500 },
  { id: 'link', name: 'Facebook / LinkedIn Link', group: 'Social', width: 1200, height: 628 },
  { id: 'x', name: 'X Post', group: 'Social', width: 1600, height: 900 },
  { id: 'youtube', name: 'YouTube Thumbnail', group: 'Social', width: 1280, height: 720 },
  { id: 'mrec', name: 'Medium Rectangle', group: 'Ads', width: 300, height: 250 },
  { id: 'lrec', name: 'Large Rectangle', group: 'Ads', width: 336, height: 280 },
  { id: 'leaderboard', name: 'Leaderboard', group: 'Ads', width: 728, height: 90 },
  { id: 'billboard', name: 'Billboard', group: 'Ads', width: 970, height: 250 },
  { id: 'halfpage', name: 'Half Page', group: 'Ads', width: 300, height: 600 },
  { id: 'skyscraper', name: 'Wide Skyscraper', group: 'Ads', width: 160, height: 600 },
  { id: 'mobile', name: 'Mobile Banner', group: 'Ads', width: 320, height: 50 },
  { id: 'mobile-lg', name: 'Large Mobile Banner', group: 'Ads', width: 320, height: 100 },
];

/** Which layout a template uses for a given canvas shape. */
export function aspectClass(width: number, height: number): AspectClass {
  const r = width / height;
  if (r < 0.45) return 'skyscraper';
  if (r < 0.7) return 'story';
  if (r < 0.9) return 'portrait';
  if (r < 1.25) return 'square';
  if (r < 3) return 'landscape';
  return 'banner';
}
