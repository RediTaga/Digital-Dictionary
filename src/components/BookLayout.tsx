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
    <div className="book" role="region" aria-label="Digital dictionary book">
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem' }}>
        {isMobile ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
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
        ) : (
          <div />
        )}

        <button className={`btn ${dictionary.isAdmin ? 'danger' : 'secondary'}`} onClick={handleAdminToggle}>
          {dictionary.isAdmin ? '🔓 Admin' : '🔒 Admin'}
        </button>
      </div>

      <div className="page" style={{ display: isMobile ? (activeTab === 'index' ? 'block' : 'none') : 'block' }}>
        <DictionaryIndex dictionary={dictionary} onAdd={guardedAdd} onEdit={guardedEdit} />
      </div>

      <div className="spine" aria-hidden="true"></div>

      <div className="page" style={{ display: isMobile ? (activeTab === 'details' ? 'block' : 'none') : 'block' }}>
        <EntryDetails dictionary={dictionary} speech={speech} onEdit={guardedEdit} onToast={onToast} />
      </div>
    </div>
  );
};

export default BookLayout;
