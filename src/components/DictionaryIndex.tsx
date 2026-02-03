import React from 'react';
import { useDictionary, Entry } from '@hooks/useDictionary';

interface Props {
  dictionary: ReturnType<typeof useDictionary>;
  onAdd: () => void;
  onEdit: (entry: Entry) => void;
}

/**
 * Displays the dictionary index: search/filter box, sort options, and list of words.
 */
const DictionaryIndex: React.FC<Props> = ({ dictionary, onAdd }) => {
  const {
    entries,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    selectedId,
    setSelectedId,
  } = dictionary;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Kërko..."
          aria-label="Kërko fjalë"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, marginRight: '0.5rem' }}
        />
        <button className="btn primary" onClick={onAdd} aria-label="Shto fjalë">
          Shto
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <label className="sr-only" htmlFor="sort-select">Rendit sipas</label>
        <select
          id="sort-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          aria-label="Rendit hyrjet"
        >
          <option value="alphabetical">A → Zh</option>
          <option value="newest">Më të rejat</option>
        </select>
      </div>
      <ul className="entry-list" role="listbox" aria-label="Lista e fjalëve">
        {entries.map((entry) => (
          <li
            key={entry.id}
            tabIndex={0}
            onClick={() => setSelectedId(entry.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedId(entry.id);
              }
            }}
            className={entry.id === selectedId ? 'selected' : ''}
            aria-selected={entry.id === selectedId}
          >
            {entry.word}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DictionaryIndex;