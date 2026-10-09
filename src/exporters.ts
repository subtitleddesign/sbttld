import JSZip from 'jszip';
import { loadBrandFonts, preloadImages } from './assets';
import { render, resolveContent, type RenderInput } from './render';
import type { AudioTrack, Format } from './types';

export const slug = (name: string) => name.trim().replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'design';

export const fileBase = (designName: string, f: Format) => `${slug(designName)}_${f.id}_${f.width}x${f.height}`;

type Downloads = { save(r: { filename: string; data: Blob }): Promise<unknown> };
type ClaudeHost = { use(name: 'downloads'): Promise<Downloads | null> };

/**
 * Saves a file. Inside a claude.ai artifact the page can't start downloads
 * itself, so it asks the viewer through the host's downloads capability.
 */
export async function download(blob: Blob, filename: string): Promise<void> {
  const host = (window as { claude?: ClaudeHost }).claude;
  const downloads = host ? await host.use('downloads') : null;
  if (downloads) {
    await downloads.save({ filename, data: blob }).catch((e: { code?: string; message?: string }) => {
      if (e?.code !== 'declined') throw new Error(e?.message ?? 'Download failed');
    });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function prepare(inp: RenderInput) {
  const content = resolveContent(inp.template, inp.content);
  const imageFields = inp.template.fields.filter((f) => f.kind === 'image').map((f) => content[f.key]);
  await Promise.all([loadBrandFonts(inp.brand), preloadImages([...imageFields, inp.brand.logo])]);
}

export async function exportPng(inp: RenderInput): Promise<Blob> {
  await prepare(inp);
  const canvas = document.createElement('canvas');
  canvas.width = inp.width;
  canvas.height = inp.height;
  render(canvas.getContext('2d')!, { ...inp, t: undefined });
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG encode failed'))), 'image/png'));
}

function pickMime(withAudio: boolean): string {
  const candidates = withAudio
    ? ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
    : ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  const found = candidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!found) throw new Error('This browser cannot record video. Use a recent Chrome, Edge or Safari.');
  return found;
}

/**
 * Records the animated design in real time. The tab must stay visible while
 * recording, because browsers pause animation frames in background tabs.
 */
export async function exportVideo(
  inp: RenderInput & { duration: number },
  audio: AudioTrack | undefined,
  onProgress?: (p: number) => void,
): Promise<{ blob: Blob; ext: string }> {
  await prepare(inp);
  const { width: W, height: H, duration } = inp;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  render(ctx, { ...inp, t: 0 });

  const stream = canvas.captureStream(30);
  let actx: AudioContext | undefined;
  let source: AudioBufferSourceNode | undefined;
  let gain: GainNode | undefined;
  if (audio) {
    actx = new AudioContext();
    const buf = await actx.decodeAudioData(dataUrlToBuffer(audio.dataUrl));
    const dest = actx.createMediaStreamDestination();
    gain = actx.createGain();
    source = actx.createBufferSource();
    source.buffer = buf;
    source.connect(gain).connect(dest);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  }

  const mimeType = pickMime(!!audio);
  const rec = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: Math.round(Math.min(16e6, Math.max(2e6, W * H * 30 * 0.2))),
  });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((res) => (rec.onstop = res));

  rec.start(250);
  if (actx && source && gain && audio) {
    const t0 = actx.currentTime;
    gain.gain.setValueAtTime(audio.volume, t0);
    gain.gain.setValueAtTime(audio.volume, t0 + Math.max(0, duration - 0.8));
    gain.gain.linearRampToValueAtTime(0, t0 + duration);
    source.start(t0, audio.offset);
  }
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      render(ctx, { ...inp, t: Math.min(t, duration) });
      onProgress?.(Math.min(1, t / duration));
      if (t >= duration) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop();
  await stopped;
  source?.stop();
  await actx?.close();
  stream.getTracks().forEach((tr) => tr.stop());

  return { blob: new Blob(chunks, { type: mimeType.split(';')[0] }), ext: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm' };
}

function dataUrlToBuffer(dataUrl: string): ArrayBuffer {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function zip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const z = new JSZip();
  for (const f of files) z.file(f.name, f.blob);
  return z.generateAsync({ type: 'blob' });
}
