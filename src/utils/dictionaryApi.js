function normalizeBaseUrl(baseUrl) {
    const trimmed = baseUrl.trim();
    // Remove trailing slash
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}
async function apiFetch(cfg, path, init) {
    const base = normalizeBaseUrl(cfg.apiBaseUrl);
    const headers = {
        ...init.headers,
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
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    }
    catch {
        json = null;
    }
    if (!res.ok) {
        const msg = json?.error || res.statusText || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.payload = json;
        throw err;
    }
    return json;
}
export async function fetchEntries(cfg) {
    const data = await apiFetch(cfg, '/api/entries', { method: 'GET' });
    if (!data || !Array.isArray(data.entries)) {
        throw new Error('Invalid response from server');
    }
    return data.entries;
}
export async function createEntry(cfg, entry) {
    const data = await apiFetch(cfg, '/api/entries', {
        method: 'POST',
        body: JSON.stringify(entry),
    });
    if (!data || !data.entry) {
        throw new Error('Invalid response from server');
    }
    return data.entry;
}
export async function updateEntryRemote(cfg, id, entry) {
    const data = await apiFetch(cfg, `/api/entries?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(entry),
    });
    if (!data || !data.entry) {
        throw new Error('Invalid response from server');
    }
    return data.entry;
}
export async function deleteEntryRemote(cfg, id) {
    await apiFetch(cfg, `/api/entries?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}
