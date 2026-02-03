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

  return (
    <div className="book" role="region" aria-label="Digital dictionary book">
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
      <div
        className="page"
        style={{ display: isMobile ? (activeTab === 'index' ? 'block' : 'none') : 'block' }}
      >
        <DictionaryIndex
          dictionary={dictionary}
          onAdd={onAdd}
          onEdit={onEdit}
        />
      </div>
      <div className="spine" aria-hidden="true"></div>
      <div
        className="page"
        style={{ display: isMobile ? (activeTab === 'details' ? 'block' : 'none') : 'block' }}
      >
        <EntryDetails
          dictionary={dictionary}
          speech={speech}
          onEdit={onEdit}
          onToast={onToast}
        />
      </div>
    </div>
  );
};

export default BookLayout;