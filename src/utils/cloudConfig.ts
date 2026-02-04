export interface CloudConfig {
  /** Base URL of your API, e.g. https://your-project.vercel.app */
  apiBaseUrl: string;
  /** Optional write passphrase, sent via X-Passphrase header */
  passphrase: string;
}

const DEFAULT_API_BASE_URL = 'https://digital-dictionary.vercel.app';

/**
 * Always-on cloud config (Option 1).
 * We intentionally do NOT use localStorage to avoid confusing UI/settings.
 */
export function loadCloudConfig(): CloudConfig | null {
  return {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    passphrase: '',
  };
}

export function saveCloudConfig(_cfg: CloudConfig): void {
  // no-op (cloud settings are fixed in code)
}

export function clearCloudConfig(): void {
  // no-op (cloud settings are fixed in code)
}
