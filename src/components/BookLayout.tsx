import React, { useState, useEffect } from 'react';
import { useDictionary, Entry } from '@hooks/useDictionary';
import { useSpeech } from '@hooks/useSpeech';
import DictionaryIndex from '@components/DictionaryIndex';
import EntryDetails from '@components/EntryDetails';

interface Props {
  dictionary: ReturnType<typeof useDictionary>;
  speech: ReturnType<typeof useSpeech>;
  onAdd: () => void;
  onEdit: (entry: Entry) => void;
  onToast: (message: string) => void;
}

/**
 * Layout component representing the pages of a book. Displays the index on the left
 * and the entry details on the right. On mobile screens, a tabbed interface is shown.
 */
const BookLayout: React.FC<Props> = ({ dictionary, speech, onAdd, onEdit, onToast }) => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState<'index' | 'details'>('index');

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When a new entry is selected, switch to details tab on mobile
  useEffect(() => {
    if (isMobile && dictionary.selectedId) {
      setActiveTab('details');
    }
  }, [isMobile, dictionary.selectedId]);

  async function handleAdminToggle() {
    if (dictionary.isAdmin) {
      dictionary.adminLogout();
      onToast('Admin u çaktivizua');
      return;
    }

    const pass = window.prompt('Shkruaj Admin Key:');
    if (!pass) return;

    const res = await dictionary.adminLogin(pass);
    if (res.success) onToast('Admin u aktivizua');
    else onToast(res.error || 'Gabim admin');
  }

  const guardedAdd = () => {
    if (!dictionary.isAdmin) {
      onToast('Vetëm admin mund të shtojë fjalë.');
      return;
    }
    onAdd();
  };

  const guardedEdit = (entry: Entry) => {
    if (!dictionary.isAdmin) {
      onToast('Vetëm admin mund të modifikojë fjalë.');
      return;
    }
    onEdit(entry);
  };

  return (
    <div className="book" role="region" aria-label="Digital dictionary book" style={{ position: 'relative' }}>
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'index' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('index')}
          >
            Indeks
          </button>
          <button
            className={`btn ${activeTab === 'details' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('details')}
          >
            Faqe
          </button>
        </div>
      )}

      <div className="page" style={{ display: isMobile ? (activeTab === 'index' ? 'block' : 'none') : 'block' }}>
        <DictionaryIndex dictionary={dictionary} onAdd={guardedAdd} onEdit={guardedEdit} />
      </div>

      <div className="spine" aria-hidden="true"></div>

      <div className="page" style={{ display: isMobile ? (activeTab === 'details' ? 'block' : 'none') : 'block' }}>
        <EntryDetails dictionary={dictionary} speech={speech} onEdit={guardedEdit} onToast={onToast} />
      </div>

      {/* Floating Admin button (does not affect layout) */}
      <button
        type="button"
        onClick={handleAdminToggle}
        title={dictionary.isAdmin ? 'Disable admin' : 'Enable admin'}
        style={{
          position: 'fixed',
          left: '14px',
          bottom: '14px',
          zIndex: 9999,
          padding: '8px 10px',
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.15)',
          background: dictionary.isAdmin ? '#ffd6d6' : '#eee',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
        }}
        aria-label={dictionary.isAdmin ? 'Admin enabled (click to disable)' : 'Admin disabled (click to enable)'}
      >
        {dictionary.isAdmin ? '🔓 Admin' : '🔒 Admin'}
      </button>
    </div>
  );
};

export default BookLayout;
