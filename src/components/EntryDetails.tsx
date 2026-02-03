import React from 'react';
import { useDictionary, Entry } from '@hooks/useDictionary';
import { useSpeech } from '@hooks/useSpeech';

interface Props {
  dictionary: ReturnType<typeof useDictionary>;
  speech: ReturnType<typeof useSpeech>;
  onEdit: (entry: Entry) => void;
  onToast: (message: string) => void;
}

/**
 * Shows details of the selected entry, along with controls to edit, delete, and speak.
 */
const EntryDetails: React.FC<Props> = ({ dictionary, speech, onEdit, onToast }) => {
  const { selectedEntry, deleteEntry } = dictionary;
  const { supported, speak, stop } = speech;
  if (!selectedEntry) {
    // Show an Albanian prompt when no entry is selected
    return <p>Zgjidhni një fjalë nga indeksi për të parë përkufizimin.</p>;
  }
  const { id, word, definition, illustration, recording } = selectedEntry;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>{word}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {supported ? (
            <button
              className="btn secondary"
              onClick={() => {
                // If already speaking, stop and restart
                if (recording) {
                  // play recorded audio
                  const audio = new Audio(recording);
                  audio.play();
                } else {
                  speech.stop();
                  speak(`${word}. ${definition}`);
                }
              }}
              aria-label={`Dëgjo ${word}`}
            >
              🔊
            </button>
          ) : (
            <span title="Speech synthesis not supported">🔇</span>
          )}
          <button className="btn secondary" onClick={() => onEdit(selectedEntry)} aria-label="Modifiko fjalën">
            Modifiko
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Të fshihet kjo fjalë?')) {
                deleteEntry(id);
                onToast('Fjala u fshi');
              }
            }}
            aria-label="Fshij fjalën"
          >
            Fshij
          </button>
        </div>
      </div>
      <p style={{ whiteSpace: 'pre-wrap' }}>{definition}</p>
      <div style={{ marginTop: '1rem' }}>
        <strong>Ilustrim:</strong>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>{illustration}</p>
        {/* Audio playback is hidden in dictionary view; the user can hear it via the speaker button */}
      </div>
    </div>
  );
};

export default EntryDetails;