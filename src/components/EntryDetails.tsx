import React, { useEffect, useMemo, useState } from 'react';
import { Entry, useDictionary } from '@hooks/useDictionary';
import { useSpeech } from '@hooks/useSpeech';

interface Props {
  dictionary: ReturnType<typeof useDictionary>;
  speech: ReturnType<typeof useSpeech>;
  onEdit: (entry: Entry) => void;
  onToast: (message: string) => void;
}

function isMobileNow(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

const EntryDetails: React.FC<Props> = ({ dictionary, speech, onEdit, onToast }) => {
  const entry = dictionary.selectedEntry;

  const [isMobile, setIsMobile] = useState<boolean>(isMobileNow());

  useEffect(() => {
    function handleResize() {
      setIsMobile(isMobileNow());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canEdit = useMemo(() => {
    return !!dictionary.isAdmin;
  }, [dictionary.isAdmin]);

  if (!entry) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Zgjidh një fjalë</h2>
        <p>Zgjidh një hyrje nga indeksi për të parë detajet.</p>
      </div>
    );
  }

  const handleSpeak = () => {
    try {
      speech.speak(entry.word);
    } catch {
      onToast('Nuk mund të luaj tingullin.');
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      onToast('Vetëm admin mund të fshijë.');
      return;
    }
    const ok = window.confirm('A je i sigurt që do ta fshish këtë fjalë?');
    if (!ok) return;

    const res = await dictionary.deleteEntryAsync(entry.id);
    if (!res.success) onToast(res.error || 'Gabim në fshirje');
    else onToast('U fshi');
  };

  const handleEdit = () => {
    if (!canEdit) {
      onToast('Vetëm admin mund të modifikojë.');
      return;
    }
    onEdit(entry);
  };

  // --- Layout styles ---
  const headerWrapStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'flex-start',
    justifyContent: 'space-between',
    gap: isMobile ? '0.5rem' : '1rem',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: isMobile ? 'flex-start' : 'flex-end',
    flexWrap: 'wrap',
    order: isMobile ? 0 : 1, // ✅ actions above title on mobile
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    marginTop: isMobile ? '0.35rem' : 0, // ✅ small extra space under buttons on mobile
    fontSize: isMobile ? '2rem' : '2.25rem',
    lineHeight: 1.1,
    order: isMobile ? 1 : 0,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontWeight: 700,
    marginTop: '1rem',
    marginBottom: '0.25rem',
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={headerWrapStyle}>
        <div style={actionsStyle}>
          <button className="btn secondary" onClick={handleSpeak} aria-label="Dëgjo fjalën">
            🔊
          </button>

          <button className="btn secondary" onClick={handleEdit} aria-label="Modifiko" disabled={!canEdit}>
            Modifiko
          </button>

          <button className="btn danger" onClick={handleDelete} aria-label="Fshi" disabled={!canEdit}>
            Fshi
          </button>
        </div>

        <h2 style={titleStyle}>{entry.word}</h2>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <p style={{ marginTop: 0 }}>{entry.definition}</p>

        <div style={sectionLabelStyle}>Ilustrim:</div>
        <div>{entry.illustration}</div>

        {entry.recording ? (
          <>
            <div style={sectionLabelStyle}>Inçizim:</div>
            <audio src={entry.recording} controls style={{ width: '100%', maxWidth: '420px' }} />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default EntryDetails;
