import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { clearCloudConfig, loadCloudConfig, saveCloudConfig } from '@utils/cloudConfig';
/**
 * Simple UI to configure the database-backed API for cross-device sync.
 *
 * This stores configuration in localStorage (per device).
 */
const CloudApiSettings = ({ onToast, onChange }) => {
    const [open, setOpen] = useState(false);
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [passphrase, setPassphrase] = useState('');
    useEffect(() => {
        const cfg = loadCloudConfig();
        setApiBaseUrl(cfg?.apiBaseUrl || '');
        setPassphrase(cfg?.passphrase || '');
    }, [open]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    display: 'flex',
                    gap: '0.5rem',
                    zIndex: 100,
                }, children: _jsx("button", { className: "btn secondary", onClick: () => setOpen(true), "aria-label": "Configure cloud sync", title: "Configure database API", children: "Cloud" }) }), open && (_jsx("div", { style: {
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
                }, children: _jsxs("div", { style: {
                        background: '#fff',
                        padding: '1.25rem',
                        borderRadius: '8px',
                        width: '92%',
                        maxWidth: '560px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Cloud Sync (Database API)" }), _jsx("p", { style: { marginTop: '0.25rem' }, children: "Enter the base URL of your API (for example your Vercel deployment), and an optional passphrase if you enabled it." }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "cloud-api-url", children: "API base URL" }), _jsx("input", { id: "cloud-api-url", value: apiBaseUrl, onChange: (e) => setApiBaseUrl(e.target.value), placeholder: "https://your-api.vercel.app" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "cloud-pass", children: "Passphrase (optional)" }), _jsx("input", { id: "cloud-pass", type: "password", value: passphrase, onChange: (e) => setPassphrase(e.target.value), placeholder: "If API_PASSPHRASE is set on the server" })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { className: "btn secondary", onClick: () => setOpen(false), "aria-label": "Close cloud settings", children: "Close" }), _jsx("button", { className: "btn secondary", onClick: () => {
                                        clearCloudConfig();
                                        setApiBaseUrl('');
                                        setPassphrase('');
                                        onToast('Cloud sync disabled on this device');
                                        onChange();
                                    }, "aria-label": "Disable cloud sync", children: "Disable" }), _jsx("button", { className: "btn primary", onClick: () => {
                                        const base = apiBaseUrl.trim();
                                        if (!base) {
                                            onToast('API base URL is required');
                                            return;
                                        }
                                        saveCloudConfig({ apiBaseUrl: base, passphrase });
                                        onToast('Cloud settings saved');
                                        onChange();
                                        setOpen(false);
                                    }, "aria-label": "Save cloud settings", children: "Save" })] })] }) }))] }));
};
export default CloudApiSettings;
