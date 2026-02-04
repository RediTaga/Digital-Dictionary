import React, { useEffect, useState } from 'react';
import { clearCloudConfig, loadCloudConfig, saveCloudConfig } from '@utils/cloudConfig';

interface Props {
  onToast: (msg: string) => void;
  /** Triggered when settings change so the app can re-sync. */
  onChange: () => void;
}

/**
 * Simple UI to configure the database-backed API for cross-device sync.
 *
 * This stores configuration in localStorage (per device).
 */
const CloudApiSettings: React.FC<Props> = ({ onToast, onChange }) => {
  const [open, setOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [passphrase, setPassphrase] = useState('');

  useEffect(() => {
    const cfg = loadCloudConfig();
    setApiBaseUrl(cfg?.apiBaseUrl || '');
    setPassphrase(cfg?.passphrase || '');
  }, [open]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 100,
        }}
      >
        <button
          className="btn secondary"
          onClick={() => setOpen(true)}
          aria-label="Configure cloud sync"
          title="Configure database API"
        >
          Cloud
        </button>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '1.25rem',
              borderRadius: '8px',
              width: '92%',
              maxWidth: '560px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Cloud Sync (Database API)</h2>
            <p style={{ marginTop: '0.25rem' }}>
              Enter the base URL of your API (for example your Vercel deployment), and an optional passphrase if you enabled it.
            </p>

            <div className="form-group">
              <label htmlFor="cloud-api-url">API base URL</label>
              <input
                id="cloud-api-url"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="https://your-api.vercel.app"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cloud-pass">Passphrase (optional)</label>
              <input
                id="cloud-pass"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="If API_PASSPHRASE is set on the server"
              />
            </div>

            <div className="form-actions">
              <button
                className="btn secondary"
                onClick={() => setOpen(false)}
                aria-label="Close cloud settings"
              >
                Close
              </button>

              <button
                className="btn secondary"
                onClick={() => {
                  clearCloudConfig();
                  setApiBaseUrl('');
                  setPassphrase('');
                  onToast('Cloud sync disabled on this device');
                  onChange();
                }}
                aria-label="Disable cloud sync"
              >
                Disable
              </button>

              <button
                className="btn primary"
                onClick={() => {
                  const base = apiBaseUrl.trim();
                  if (!base) {
                    onToast('API base URL is required');
                    return;
                  }
                  saveCloudConfig({ apiBaseUrl: base, passphrase });
                  onToast('Cloud settings saved');
                  onChange();
                  setOpen(false);
                }}
                aria-label="Save cloud settings"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CloudApiSettings;
