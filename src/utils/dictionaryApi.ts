import type { Entry } from '@hooks/useDictionary';
import type { CloudConfig } from '@utils/cloudConfig';

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
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

function normalizeEntry(e: any): Entry {
  const now = Date.now();
  return {
    id: String(e.id),
    word: String(e.word ?? ''),
    definition: String(e.definition ?? ''),
    illustration: String(e.illustration ?? ''),
    recording: e.recording ?? null,
    createdAt: typeof e.createdAt === 'number' ? e.createdAt : now,
    updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : now,
  };
}

export async function fetchEntries(cfg: CloudConfig): Promise<Entry[]> {
  const data = await apiFetch(cfg, '/api/entries', { method: 'GET' });
  if (!data || !Array.isArray(data.entries)) {
    throw new Error('Invalid response from server');
  }
  return data.entries.map(normalizeEntry);
}

export async function createEntry(
  cfg: CloudConfig,
  entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Entry> {
  const data = await apiFetch(cfg, '/api/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
  if (!data || !data.entry) {
    throw new Error('Invalid response from server');
  }
  return normalizeEntry(data.entry);
}

export async function updateEntryRemote(
  cfg: CloudConfig,
  id: string,
  entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Entry> {
  const data = await apiFetch(cfg, `/api/entries?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
  if (!data || !data.entry) {
    throw new Error('Invalid response from server');
  }
  return normalizeEntry(data.entry);
}

export async function deleteEntryRemote(cfg: CloudConfig, id: string): Promise<void> {
  await apiFetch(cfg, `/api/entries?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
