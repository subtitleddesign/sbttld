import { useEffect, useState } from 'react';
import { readFileAsDataUrl } from '../assets';
import { PLANS } from '../plans';
import type { Client, ColorToken, FontDef, PlanId, Template } from '../types';

interface Props {
  client: Client;
  onChange: (c: Client) => void;
}

const COLOR_LABELS: Record<ColorToken, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  background: 'Background',
  text: 'Text',
  textOnPrimary: 'Text on primary',
};

function validateTemplates(v: unknown): v is Template[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((t) => t && typeof t.id === 'string' && typeof t.name === 'string' && Array.isArray(t.fields) && Array.isArray(t.elements))
  );
}

export function BrandSetup({ client, onChange }: Props) {
  const { brand } = client;
  const [json, setJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    setJson(JSON.stringify(client.templates, null, 2));
    setJsonError('');
  }, [client.id, client.templates]);

  const setBrand = (patch: Partial<Client['brand']>) => onChange({ ...client, brand: { ...brand, ...patch } });

  const fontEditor = (key: 'headingFont' | 'bodyFont', label: string) => {
    const f = brand[key];
    const set = (patch: Partial<FontDef>) => setBrand({ [key]: { ...f, ...patch } });
    return (
      <div className="font-editor">
        <h4>{label}</h4>
        <div className="row">
          <label className="field grow">
            <span>Family</span>
            <input value={f.family} onChange={(e) => set({ family: e.target.value })} />
          </label>
          <label className="field">
            <span>Weight</span>
            <select value={f.weight} onChange={(e) => set({ weight: Number(e.target.value) })}>
              {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Source</span>
          <select value={f.source} onChange={(e) => set({ source: e.target.value as FontDef['source'] })}>
            <option value="google">Google Fonts</option>
            <option value="upload">Uploaded font file</option>
          </select>
        </label>
        {f.source === 'upload' && (
          <label className="field">
            <span>Font file {f.dataUrl ? '(loaded)' : ''}</span>
            <input
              type="file"
              accept=".woff2,.woff,.ttf,.otf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) set({ dataUrl: await readFileAsDataUrl(file) });
              }}
            />
          </label>
        )}
        <p className="font-sample" style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}>
          The quick brown fox
        </p>
      </div>
    );
  };

  return (
    <div className="setup">
      <div className="setup-col">
        <section className="panel-card">
          <h3>Client</h3>
          <label className="field">
            <span>Name</span>
            <input value={client.name} onChange={(e) => onChange({ ...client, name: e.target.value })} />
          </label>
          <label className="field">
            <span>Subscription</span>
            <select value={client.plan} onChange={(e) => onChange({ ...client, plan: e.target.value as PlanId })}>
              {Object.values(PLANS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="panel-card">
          <h3>Colours</h3>
          <div className="swatches">
            {(Object.keys(COLOR_LABELS) as ColorToken[]).map((k) => (
              <label key={k} className="swatch">
                <input type="color" value={brand.colors[k]} onChange={(e) => setBrand({ colors: { ...brand.colors, [k]: e.target.value } })} />
                <span>{COLOR_LABELS[k]}</span>
                <code>{brand.colors[k].toUpperCase()}</code>
              </label>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <h3>Logo</h3>
          <div className="logo-preview" style={{ background: brand.colors.primary }}>
            {brand.logo ? <img src={brand.logo} alt="" /> : <span style={{ color: brand.colors.textOnPrimary }}>No logo — wordmark is used</span>}
          </div>
          <div className="row">
            <input
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setBrand({ logo: await readFileAsDataUrl(file) });
              }}
            />
            {brand.logo && (
              <button className="btn small ghost" onClick={() => setBrand({ logo: undefined })}>
                Remove
              </button>
            )}
          </div>
          <p className="muted small">Use a transparent PNG or SVG that reads on the primary colour.</p>
        </section>
      </div>

      <div className="setup-col">
        <section className="panel-card">
          <h3>Typography</h3>
          {fontEditor('headingFont', 'Headings')}
          {fontEditor('bodyFont', 'Body & buttons')}
          <p className="muted small">Check the client's font licence covers embedding in apps before uploading a commercial font.</p>
        </section>

        <section className="panel-card">
          <h3>Templates (advanced)</h3>
          <p className="muted small">
            Layouts are defined per shape (square, portrait, story, landscape, banner, skyscraper) as fractions of the canvas. Clients can only edit the fields.
          </p>
          <textarea className="code" rows={18} value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
          {jsonError && <p className="error small">{jsonError}</p>}
          <button
            className="btn"
            onClick={() => {
              try {
                const parsed = JSON.parse(json);
                if (!validateTemplates(parsed)) throw new Error('Expected a non-empty array of templates with id, name, fields and elements.');
                onChange({ ...client, templates: parsed });
                setJsonError('');
              } catch (e) {
                setJsonError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Apply templates
          </button>
        </section>
      </div>
    </div>
  );
}
