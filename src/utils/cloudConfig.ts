export interface CloudConfig {
  /** Base URL of your API, e.g. https://your-project.vercel.app */
  apiBaseUrl: string;
  /** Optional write passphrase, sent via X-Passphrase header */
  passphrase: string;
}

const KEY = 'digital_dictionary_cloud_cfg_v1';

export function loadCloudConfig(): CloudConfig | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const apiBaseUrl = typeof parsed.apiBaseUrl === 'string' ? parsed.apiBaseUrl.trim() : '';
    const passphrase = typeof parsed.passphrase === 'string' ? parsed.passphrase : '';
    if (!apiBaseUrl) return null;
    return { apiBaseUrl, passphrase };
  } catch {
    return null;
  }
}

export function saveCloudConfig(cfg: CloudConfig): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export function clearCloudConfig(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
