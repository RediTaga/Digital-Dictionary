import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef } from 'react';
/**
 * Provides import and export functionality with conflict resolution.
 */
const ImportExport = ({ dictionary, onToast }) => {
    const fileInputRef = useRef(null);
    const [imported, setImported] = useState(null);
    const [resolution, setResolution] = useState('skip');
    function handleExport() {
        const json = dictionary.exportEntries();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'digital-dictionary-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onToast('Exported');
    }
    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
                throw new Error('Invalid file format');
            }
            const entries = parsed.entries;
            setImported(entries);
        }
        catch {
            onToast('Failed to import: invalid file');
        }
        finally {
            e.target.value = '';
        }
    }
    function handleImport() {
        if (!imported)
            return;
        const result = dictionary.importEntries(imported, { strategy: resolution });
        onToast(`Imported: ${result.added} added, ${result.overwritten} overwritten, ${result.skipped} skipped.`);
        setImported(null);
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    display: 'flex',
                    gap: '0.5rem',
                    zIndex: 100,
                }, children: [_jsx("button", { className: "btn secondary", onClick: handleExport, "aria-label": "Export entries", children: "Export" }), _jsx("button", { className: "btn secondary", onClick: () => {
                            fileInputRef.current?.click();
                        }, "aria-label": "Import entries", children: "Import" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "application/json", style: { display: 'none' }, onChange: handleFileChange })] }), imported && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }, children: _jsxs("div", { style: {
                        background: '#fff',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Resolve Duplicates" }), _jsx("p", { children: 'How should duplicates (matching words) be handled when importing?' }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "radio", name: "resolution", value: "skip", checked: resolution === 'skip', onChange: () => setResolution('skip') }), "Skip duplicate entries"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "radio", name: "resolution", value: "overwrite", checked: resolution === 'overwrite', onChange: () => setResolution('overwrite') }), "Overwrite existing entries"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "radio", name: "resolution", value: "keepBoth", checked: resolution === 'keepBoth', onChange: () => setResolution('keepBoth') }), "Keep both (add suffix)"] }) }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { className: "btn secondary", onClick: () => setImported(null), children: "Cancel" }), _jsx("button", { className: "btn primary", onClick: handleImport, children: "Import" })] })] }) }))] }));
};
export default ImportExport;
