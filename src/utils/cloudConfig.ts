export interface CloudConfig {
  apiBaseUrl: string;
  passphrase: string;
}

const DEFAULT_API_BASE_URL = 'https://digital-dictionary.vercel.app';
const ADMIN_KEY = 'dd_admin_passphrase';

export function loadCloudConfig(): CloudConfig | null {
  let passphrase = '';
  try {
    passphrase = sessionStorage.getItem(ADMIN_KEY) || '';
  } catch {
    passphrase = '';
  }
  return { apiBaseUrl: DEFAULT_API_BASE_URL, passphrase };
}

export function setAdminPassphrase(pass: string): void {
  try {
    sessionStorage.setItem(ADMIN_KEY, pass);
  } catch {
    // ignore
  }
}

export function clearAdminPassphrase(): void {
  try {
    sessionStorage.removeItem(ADMIN_KEY);
  } catch {
    // ignore
  }
}
