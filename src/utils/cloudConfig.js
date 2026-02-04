const KEY = 'digital_dictionary_cloud_cfg_v1';
export function loadCloudConfig() {
    try {
        if (typeof localStorage === 'undefined')
            return null;
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        const apiBaseUrl = typeof parsed.apiBaseUrl === 'string' ? parsed.apiBaseUrl.trim() : '';
        const passphrase = typeof parsed.passphrase === 'string' ? parsed.passphrase : '';
        if (!apiBaseUrl)
            return null;
        return { apiBaseUrl, passphrase };
    }
    catch {
        return null;
    }
}
export function saveCloudConfig(cfg) {
    try {
        if (typeof localStorage === 'undefined')
            return;
        localStorage.setItem(KEY, JSON.stringify(cfg));
    }
    catch {
        // ignore
    }
}
export function clearCloudConfig() {
    try {
        if (typeof localStorage === 'undefined')
            return;
        localStorage.removeItem(KEY);
    }
    catch {
        // ignore
    }
}
