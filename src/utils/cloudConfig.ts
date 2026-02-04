export type CloudConfig = {
  enabled: boolean;
  apiBaseUrl: string;
  passphrase?: string;
};

// Always-on cloud sync (Option 1: no passphrase)
const DEFAULT_API_BASE_URL = 'https://digital-dictionary.vercel.app';

export function getCloudConfig(): CloudConfig {
  return {
    enabled: true,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    passphrase: ''
  };
}

export function setCloudConfig(_cfg: CloudConfig): void {
  // Intentionally ignore user changes to avoid confusing UI.
}

export function clearCloudConfig(): void {
  // No-op: cloud is always enabled.
}
