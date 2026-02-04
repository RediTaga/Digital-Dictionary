import type { Entry } from '@hooks/useDictionary';
import type { CloudConfig } from '@utils/cloudConfig';

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  // Remove trailing slash
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

async function apiFetch(cfg: CloudConfig, path: string, init: RequestInit): Promise<any> {
  const base = normalizeBaseUrl(cfg.apiBaseUrl);
  const headers: Record<string, string> = {
    ...(init.headers as any),
  };
  if (cfg.passphrase) {
    headers['X-Passphrase'] = cfg.passphrase;
  }
  if (!headers['Content-Type'] && init.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.error || res.statusText || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

export async function fetchEntries(cfg: CloudConfig): Promise<Entry[]> {
  const data = await apiFetch(cfg, '/api/entries', { method: 'GET' });
  if (!data || !Array.isArray(data.entries)) {
    throw new Error('Invalid response from server');
  }
  return data.entries as Entry[];
}

export async function createEntry(cfg: CloudConfig, entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entry> {
  const data = await apiFetch(cfg, '/api/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
  if (!data || !data.entry) {
    throw new Error('Invalid response from server');
  }
  return data.entry as Entry;
}

export async function updateEntryRemote(cfg: CloudConfig, id: string, entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entry> {
  const data = await apiFetch(cfg, `/api/entries?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
  if (!data || !data.entry) {
    throw new Error('Invalid response from server');
  }
  return data.entry as Entry;
}

export async function deleteEntryRemote(cfg: CloudConfig, id: string): Promise<void> {
  await apiFetch(cfg, `/api/entries?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
