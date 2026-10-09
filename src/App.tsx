import { useEffect, useState } from 'react';
import { loadBrandFonts, onAssetsChange } from './assets';
import { BrandSetup } from './components/BrandSetup';
import { Editor } from './components/Editor';
import { PLANS } from './plans';
import { loadClients, loadDesigns, saveClients, saveDesigns, uid } from './storage';
import { TEMPLATE_LIBRARY } from './templates';
import type { Client, Design } from './types';

// In production the role comes from the signed-in user; here it is a demo toggle.
type Role = 'agency' | 'client';

export function App() {
  const [clients, setClients] = useState<Client[]>();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [clientId, setClientId] = useState<string>();
  const [role, setRole] = useState<Role>('agency');
  const [view, setView] = useState<'editor' | 'brand'>('editor');
  const [assetVersion, setAssetVersion] = useState(0);

  useEffect(() => {
    void Promise.all([loadClients(), loadDesigns()]).then(([c, d]) => {
      setClients(c);
      setDesigns(d);
      setClientId(c[0]?.id);
    });
    return onAssetsChange(() => setAssetVersion((v) => v + 1));
  }, []);

  const client = clients?.find((c) => c.id === clientId);

  useEffect(() => {
    if (client) void loadBrandFonts(client.brand);
  }, [client?.brand]);

  if (!clients || !client) return <div className="loading">Loading…</div>;

  const updateClient = (c: Client) => {
    const next = clients.map((x) => (x.id === c.id ? c : x));
    setClients(next);
    void saveClients(next);
  };

  const addClient = () => {
    const brand = { ...structuredClone(client.brand), logo: undefined };
    const c: Client = { id: uid(), name: 'New client', plan: 'essentials', brand, templates: structuredClone(TEMPLATE_LIBRARY) };
    const next = [...clients, c];
    setClients(next);
    setClientId(c.id);
    setView('brand');
    void saveClients(next);
  };

  const persistDesigns = (next: Design[]) => {
    setDesigns(next);
    void saveDesigns(next);
  };

  const plan = PLANS[client.plan];
  const showBrand = role === 'agency' && view === 'brand';

  return (
    <div className="app">
      <header className="topbar">
        <div className="row">
          <span className="wordmark">sbttld</span>
          <span className="muted">Studio</span>
        </div>

        <div className="row">
          {role === 'agency' ? (
            <>
              <select value={client.id} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button className="btn small ghost" onClick={addClient}>
                + Client
              </button>
              <div className="tabs">
                <button className={`tab ${view === 'editor' ? 'active' : ''}`} onClick={() => setView('editor')}>
                  Create
                </button>
                <button className={`tab ${view === 'brand' ? 'active' : ''}`} onClick={() => setView('brand')}>
                  Brand setup
                </button>
              </div>
            </>
          ) : (
            <span className="client-name">
              {client.name} <span className="badge">🔒 Brand locked</span>
            </span>
          )}
          <span className={`badge plan-${plan.id}`}>{plan.name}</span>
        </div>

        <div className="row muted small">
          View as
          <div className="tabs">
            {(['agency', 'client'] as const).map((r) => (
              <button key={r} className={`tab ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>
                {r === 'agency' ? 'Subtitled' : 'Client'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {showBrand ? (
        <BrandSetup client={client} onChange={updateClient} />
      ) : (
        <Editor
          client={client}
          designs={designs}
          assetVersion={assetVersion}
          onSaveDesign={(d) => persistDesigns([d, ...designs.filter((x) => x.id !== d.id)])}
          onDeleteDesign={(id) => persistDesigns(designs.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
