import { useEffect, useRef } from 'react';
import { render, type RenderInput } from '../render';
import type { Format } from '../types';

interface Props {
  format: Format;
  input: Omit<RenderInput, 'width' | 'height' | 't'>;
  maxSize: number;
  /** performance.now() when playback started; undefined shows the static frame. */
  playStart?: number;
  assetVersion: number;
  locked?: string;
  busy?: string;
  onPng: () => void;
  onVideo: () => void;
}

export function PreviewCard({ format, input, maxSize, playStart, assetVersion, locked, busy, onPng, onVideo }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const scale = Math.min(maxSize / format.width, maxSize / format.height, 1);
  const w = Math.round(format.width * scale);
  const h = Math.round(format.height * scale);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d')!;
    const draw = (t?: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform((w * dpr) / format.width, 0, 0, (h * dpr) / format.height, 0, 0);
      render(ctx, { ...input, width: format.width, height: format.height, t });
    };
    if (playStart === undefined) {
      draw();
      return;
    }
    let raf = 0;
    const loop = () => {
      const duration = input.duration ?? 6;
      draw(((performance.now() - playStart) / 1000) % duration);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [input, format, w, h, playStart, assetVersion]);

  return (
    <figure className="card">
      <div className="card-canvas" style={{ minHeight: Math.min(maxSize, 120) }}>
        <canvas ref={ref} style={{ width: w, height: h }} />
      </div>
      <figcaption>
        <div>
          <strong>{format.name}</strong>
          <span className="muted">
            {format.width}×{format.height}
          </span>
        </div>
        <div className="card-actions">
          <button className="btn small" onClick={onPng} disabled={!!busy}>
            PNG
          </button>
          <button className="btn small" onClick={onVideo} disabled={!!busy || !!locked} title={locked}>
            {locked ? 'Video 🔒' : 'Video'}
          </button>
        </div>
      </figcaption>
      {busy && <div className="card-busy">{busy}</div>}
    </figure>
  );
}
