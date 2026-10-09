// Prototype persistence in the browser (IndexedDB). In production this becomes
// an API backed by a database, with uploads in object storage.
import { SAMPLE_CLIENTS } from './templates';
import type { Client, Design } from './types';

const DB = 'sbttld-studio';
const STORE = 'kv';
let dbp: Promise<IDBDatabase> | undefined;

function db(): Promise<IDBDatabase> {
  return (dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}

async function req<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => {
    const r = fn(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => res(r.result as T);
    r.onerror = () => rej(r.error);
  });
}

const get = <T,>(k: string) => req<T | undefined>('readonly', (s) => s.get(k));
const set = (k: string, v: unknown) => req<void>('readwrite', (s) => s.put(v, k));

export async function loadClients(): Promise<Client[]> {
  return (await get<Client[]>('clients')) ?? structuredClone(SAMPLE_CLIENTS);
}
export const saveClients = (clients: Client[]) => set('clients', clients);

export async function loadDesigns(): Promise<Design[]> {
  return (await get<Design[]>('designs')) ?? [];
}
export const saveDesigns = (designs: Design[]) => set('designs', designs);

export const uid = () => Math.random().toString(36).slice(2, 10);
