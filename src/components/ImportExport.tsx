import React, { useState, useRef } from 'react';
import { useDictionary, Entry, ImportConflictResolution } from '@hooks/useDictionary';

interface Props {
  dictionary: ReturnType<typeof useDictionary>;
  onToast: (message: string) => void;
}

/**
 * Provides import and export functionality with conflict resolution.
 */
const ImportExport: React.FC<Props> = ({ dictionary, onToast }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imported, setImported] = useState<Entry[] | null>(null);
  const [resolution, setResolution] = useState<ImportConflictResolution['strategy']>('skip');

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
        throw new Error('Invalid file format');
      }
      const entries: Entry[] = parsed.entries;
      setImported(entries);
    } catch {
      onToast('Failed to import: invalid file');
    } finally {
      e.target.value = '';
    }
  }

  function handleImport() {
    if (!imported) return;
    const result = dictionary.importEntries(imported, { strategy: resolution });
    onToast(`Imported: ${result.added} added, ${result.overwritten} overwritten, ${result.skipped} skipped.`);
    setImported(null);
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 100,
        }}
      >
        <button className="btn secondary" onClick={handleExport} aria-label="Export entries">
          Export
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            fileInputRef.current?.click();
          }}
          aria-label="Import entries"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {/* Conflict resolution modal */}
      {imported && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Resolve Duplicates</h2>
            <p>{
              'How should duplicates (matching words) be handled when importing?'
            }</p>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="resolution"
                  value="skip"
                  checked={resolution === 'skip'}
                  onChange={() => setResolution('skip')}
                />
                Skip duplicate entries
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="resolution"
                  value="overwrite"
                  checked={resolution === 'overwrite'}
                  onChange={() => setResolution('overwrite')}
                />
                Overwrite existing entries
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="resolution"
                  value="keepBoth"
                  checked={resolution === 'keepBoth'}
                  onChange={() => setResolution('keepBoth')}
                />
                Keep both (add suffix)
              </label>
            </div>
            <div className="form-actions">
              <button className="btn secondary" onClick={() => setImported(null)}>Cancel</button>
              <button className="btn primary" onClick={handleImport}>Import</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportExport;