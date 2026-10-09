import { useEffect, useMemo, useState } from 'react';
import { readFileAsDataUrl } from '../assets';
import { download, exportPng, exportVideo, fileBase, slug, zip } from '../exporters';
import { FORMATS } from '../formats';
import { PLANS } from '../plans';
import { uid } from '../storage';
import type { Client, Design, Format } from '../types';
import { PreviewCard } from './PreviewCard';

interface Props {
  client: Client;
  designs: Design[];
  assetVersion: number;
  onSaveDesign: (d: Design) => void;
  onDeleteDesign: (id: string) => void;
}

export function newDesign(client: Client, templateId = client.templates[0]?.id ?? ''): Design {
  return { id: uid(), clientId: client.id, templateId, name: 'Untitled design', content: {}, duration: 6, updatedAt: Date.now() };
}

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export function Editor({ client, designs, assetVersion, onSaveDesign, onDeleteDesign }: Props) {
  const plan = PLANS[client.plan];
  const [design, setDesign] = useState(() => newDesign(client));
  const [dirty, setDirty] = useState(false);
  const [group, setGroup] = useState<'Social' | 'Ads'>('Social');
  const [previewSize, setPreviewSize] = useState(260);
  const [playStart, setPlayStart] = useState<number>();
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    setDesign(newDesign(client));
    setDirty(false);
  }, [client.id]);

  const template = client.templates.find((t) => t.id === design.templateId) ?? client.templates[0];
  const formats = FORMATS.filter((f) => f.group === group);
  const input = useMemo(
    () => ({ template, brand: client.brand, clientName: client.name, content: design.content, duration: design.duration }),
    [template, client.brand, client.name, design.content, design.duration],
  );

  // Play the audio alongside the animated previews.
  useEffect(() => {
    if (playStart === undefined || !design.audio || !plan.audio) return;
    const el = new Audio(design.audio.dataUrl);
    el.volume = Math.min(1, design.audio.volume);
    const offset = design.audio.offset;
    const restart = () => {
      el.currentTime = offset;
      void el.play();
    };
    restart();
    const id = setInterval(restart, design.duration * 1000);
    return () => {
      clearInterval(id);
      el.pause();
    };
  }, [playStart, design.audio, design.duration, plan.audio]);

  const update = (patch: Partial<Design>) => {
    setDesign((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const setField = (key: string, value: string) => update({ content: { ...design.content, [key]: value } });

  const save = () => {
    const isNew = !designs.some((d) => d.id === design.id);
    if (isNew && designs.length >= plan.maxSavedDesigns) {
      setStatus(`${plan.name} saves up to ${plan.maxSavedDesigns} designs. Upgrade to Studio for unlimited.`);
      return;
    }
    const saved = { ...design, updatedAt: Date.now() };
    onSaveDesign(saved);
    setDesign(saved);
    setDirty(false);
    setStatus('Saved');
  };

  const open = (d: Design) => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    setDesign(structuredClone(d));
    setDirty(false);
  };

  const startNew = () => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    setDesign(newDesign(client, design.templateId));
    setDirty(false);
  };

  const withBusy = async (id: string, label: string, fn: () => Promise<void>) => {
    setBusy((b) => ({ ...b, [id]: label }));
    try {
      await fn();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(({ [id]: _, ...rest }) => rest);
    }
  };

  const renderInput = (f: Format) => ({ ...input, width: f.width, height: f.height });
  const audio = plan.audio ? design.audio : undefined;

  const pngOne = (f: Format) =>
    withBusy(f.id, 'Rendering…', async () => download(await exportPng(renderInput(f)), `${fileBase(design.name, f)}.png`));

  const videoOne = (f: Format) =>
    withBusy(f.id, 'Recording 0%', async () => {
      const { blob, ext } = await exportVideo({ ...renderInput(f), duration: design.duration }, audio, (p) =>
        setBusy((b) => ({ ...b, [f.id]: `Recording ${Math.round(p * 100)}%` })),
      );
      download(blob, `${fileBase(design.name, f)}.${ext}`);
    });

  const pngAll = () =>
    withBusy('all', 'Rendering PNGs…', async () => {
      const files = [];
      for (const f of formats) files.push({ name: `${fileBase(design.name, f)}.png`, blob: await exportPng(renderInput(f)) });
      download(await zip(files), `${slug(design.name)}_${group.toLowerCase()}_png.zip`);
    });

  const videoAll = () =>
    withBusy('all', 'Recording videos…', async () => {
      const files = [];
      for (const [i, f] of formats.entries()) {
        const { blob, ext } = await exportVideo({ ...renderInput(f), duration: design.duration }, audio, (p) =>
          setBusy((b) => ({ ...b, all: `Recording ${i + 1}/${formats.length} · ${Math.round(p * 100)}%` })),
        );
        files.push({ name: `${fileBase(design.name, f)}.${ext}`, blob });
      }
      download(await zip(files), `${slug(design.name)}_${group.toLowerCase()}_video.zip`);
    });

  const onImage = async (key: string, file?: File) => {
    if (file) setField(key, await readFileAsDataUrl(file));
  };

  const onAudio = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_AUDIO_BYTES) {
      setStatus('Audio files must be under 15 MB.');
      return;
    }
    update({ audio: { name: file.name, dataUrl: await readFileAsDataUrl(file), volume: 0.8, offset: 0 } });
  };

  const adsLocked = group === 'Ads' && !plan.adSizes;
  const videoLocked = plan.video ? undefined : 'Video export is included in Studio';
  const clientDesigns = designs.filter((d) => d.clientId === client.id).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="editor">
      <aside className="panel">
        <section>
          <h3>Template</h3>
          <div className="template-list">
            {client.templates.map((t) => (
              <button key={t.id} className={`chip ${t.id === template.id ? 'active' : ''}`} onClick={() => update({ templateId: t.id })}>
                {t.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Content</h3>
          <label className="field">
            <span>Design name</span>
            <input value={design.name} onChange={(e) => update({ name: e.target.value })} />
          </label>
          {template.fields.map((f) => {
            const value = design.content[f.key] ?? f.default;
            if (f.kind === 'image') {
              return (
                <label key={f.key} className="field">
                  <span>{f.label}</span>
                  <div className="row">
                    <input type="file" accept="image/*" onChange={(e) => onImage(f.key, e.target.files?.[0])} />
                    {design.content[f.key] && (
                      <button className="btn small ghost" onClick={() => setField(f.key, '')}>
                        Remove
                      </button>
                    )}
                  </div>
                </label>
              );
            }
            const Input = f.kind === 'longtext' ? 'textarea' : 'input';
            return (
              <label key={f.key} className="field">
                <span>
                  {f.label}
                  {f.maxChars && (
                    <em className="muted">
                      {value.length}/{f.maxChars}
                    </em>
                  )}
                </span>
                <Input value={value} maxLength={f.maxChars} rows={3} onChange={(e) => setField(f.key, e.target.value)} />
              </label>
            );
          })}
        </section>

        <section>
          <h3>
            Motion &amp; audio {!plan.audio && <span className="badge">Studio</span>}
          </h3>
          <label className="field">
            <span>Video length</span>
            <select value={design.duration} onChange={(e) => update({ duration: Number(e.target.value) })} disabled={!plan.video}>
              {[6, 10, 15].map((s) => (
                <option key={s} value={s}>
                  {s} seconds
                </option>
              ))}
            </select>
          </label>
          {plan.audio ? (
            <>
              <label className="field">
                <span>Audio track</span>
                <input type="file" accept="audio/*" onChange={(e) => onAudio(e.target.files?.[0])} />
              </label>
              {design.audio && (
                <div className="audio-box">
                  <div className="row between">
                    <span className="truncate">♪ {design.audio.name}</span>
                    <button className="btn small ghost" onClick={() => update({ audio: undefined })}>
                      Remove
                    </button>
                  </div>
                  <label className="field">
                    <span>Volume {Math.round(design.audio.volume * 100)}%</span>
                    <input type="range" min={0} max={1} step={0.05} value={design.audio.volume} onChange={(e) => update({ audio: { ...design.audio!, volume: Number(e.target.value) } })} />
                  </label>
                  <label className="field">
                    <span>Start from {design.audio.offset}s</span>
                    <input type="range" min={0} max={120} step={1} value={design.audio.offset} onChange={(e) => update({ audio: { ...design.audio!, offset: Number(e.target.value) } })} />
                  </label>
                </div>
              )}
            </>
          ) : (
            <p className="muted small">Animated video exports with music are part of the Studio plan.</p>
          )}
        </section>

        <section className="sticky-save">
          <div className="row">
            <button className="btn primary grow" onClick={save}>
              {dirty || !designs.some((d) => d.id === design.id) ? 'Save design' : 'Saved'}
            </button>
            <button className="btn ghost" onClick={startNew}>
              New
            </button>
          </div>
          {status && <p className="muted small">{status}</p>}
        </section>

        <section>
          <h3>Saved designs</h3>
          {clientDesigns.length === 0 && <p className="muted small">Nothing saved yet.</p>}
          <ul className="saved">
            {clientDesigns.map((d) => (
              <li key={d.id} className={d.id === design.id ? 'active' : ''}>
                <button className="link" onClick={() => open(d)}>
                  {d.name}
                  <span className="muted small">{new Date(d.updatedAt).toLocaleDateString()}</span>
                </button>
                <button className="btn small ghost" onClick={() => confirm(`Delete "${d.name}"?`) && onDeleteDesign(d.id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="canvas-area">
        <div className="toolbar">
          <div className="tabs">
            {(['Social', 'Ads'] as const).map((g) => (
              <button key={g} className={`tab ${group === g ? 'active' : ''}`} onClick={() => setGroup(g)}>
                {g === 'Social' ? 'Social formats' : 'Ad sizes'}
                {g === 'Ads' && !plan.adSizes && ' 🔒'}
              </button>
            ))}
          </div>
          <div className="row">
            <label className="row muted small">
              Size
              <input type="range" min={140} max={480} value={previewSize} onChange={(e) => setPreviewSize(Number(e.target.value))} />
            </label>
            <button className="btn" onClick={() => setPlayStart(playStart === undefined ? performance.now() : undefined)}>
              {playStart === undefined ? '▶ Preview motion' : '■ Stop'}
            </button>
            <button className="btn" onClick={pngAll} disabled={!!busy.all || adsLocked}>
              Export all PNG
            </button>
            <button className="btn primary" onClick={videoAll} disabled={!!busy.all || adsLocked || !plan.video} title={videoLocked}>
              Export all video {!plan.video && '🔒'}
            </button>
          </div>
        </div>
        {busy.all && <div className="banner">{busy.all} — keep this tab open and visible while recording.</div>}

        {adsLocked ? (
          <div className="upsell">
            <h2>Ad sizes are part of Studio</h2>
            <p className="muted">
              Every IAB display size — leaderboards, skyscrapers, MPUs and mobile banners — built from the same design, plus animated video and music.
            </p>
          </div>
        ) : (
          <div className="grid">
            {formats.map((f) => (
              <PreviewCard
                key={f.id}
                format={f}
                input={input}
                maxSize={previewSize}
                playStart={playStart}
                assetVersion={assetVersion}
                locked={videoLocked}
                busy={busy[f.id]}
                onPng={() => pngOne(f)}
                onVideo={() => videoOne(f)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
