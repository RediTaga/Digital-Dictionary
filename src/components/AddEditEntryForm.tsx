import React, { useState } from 'react';
import { Entry } from '@hooks/useDictionary';

interface Props {
  title: string;
  initial: Entry | null;
  /**
   * Called when the user saves the entry. Receives word, definition, illustration, and recording.
   * Should return true if successful, false otherwise.
   */
  onSave: (word: string, definition: string, illustration: string, recording: string | null) => boolean;
  onCancel: () => void;
}

/**
 * Form for adding or editing a dictionary entry. Appears as a modal overlay.
 */
const AddEditEntryForm: React.FC<Props> = ({ title, initial, onSave, onCancel }) => {
  const [word, setWord] = useState(initial?.word || '');
  const [definition, setDefinition] = useState(initial?.definition || '');
  const [illustration, setIllustration] = useState(initial?.illustration || '');
  const [recordingData, setRecordingData] = useState<string | null>(initial?.recording ?? null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const [errors, setErrors] = useState<{ word?: string; definition?: string; illustration?: string }>({});

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setRecordingData(base64);
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  function stopRecording() {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: { word?: string; definition?: string; illustration?: string } = {};
    const trimmedWord = word.trim();
    const trimmedDef = definition.trim();
    const trimmedIll = illustration.trim();
    if (!trimmedWord) {
      newErrors.word = 'Fjala është e detyrueshme.';
    } else if (trimmedWord.length > 60) {
      newErrors.word = 'Fjala duhet të ketë deri në 60 karaktere.';
    }
    if (!trimmedDef) {
      newErrors.definition = 'Përkufizimi është i detyrueshëm.';
    } else if (trimmedDef.length > 2000) {
      newErrors.definition = 'Përkufizimi duhet të ketë deri në 2000 karaktere.';
    }
    if (!trimmedIll) {
      newErrors.illustration = 'Ilustrimi është i detyrueshëm.';
    } else if (trimmedIll.length > 500) {
      newErrors.illustration = 'Ilustrimi duhet të ketë deri në 500 karaktere.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      const success = onSave(trimmedWord, trimmedDef, trimmedIll, recordingData);
      if (!success) {
        // Error already handled via toast from parent
        return;
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <div className="form-group">
          <label htmlFor="word-input">Fjalë</label>
          <input
            id="word-input"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            aria-required="true"
          />
          {errors.word && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.word}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="definition-input">Përkufizim</label>
          <textarea
            id="definition-input"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            rows={4}
            aria-required="true"
          />
          {errors.definition && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.definition}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="illustration-input">Ilustrim (fjalë në fjali)</label>
          <textarea
            id="illustration-input"
            value={illustration}
            onChange={(e) => setIllustration(e.target.value)}
            rows={3}
            aria-required="true"
          />
          {errors.illustration && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.illustration}</div>}
        </div>
        {/* Audio recording controls */}
        <div className="form-group">
          <label>Inçizim audio</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isRecording && (
              <button
                type="button"
                className="btn secondary"
                onClick={startRecording}
                aria-label="Regjistro audio"
              >
                Regjistro
              </button>
            )}
            {isRecording && (
              <button
                type="button"
                className="btn danger"
                onClick={stopRecording}
                aria-label="Ndalo regjistrimin"
              >
                Ndalo
              </button>
            )}
            {recordingData && !isRecording && (
              <>
                <audio src={recordingData} controls style={{ maxWidth: '200px' }} />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setRecordingData(null);
                  }}
                  aria-label="Fshi inçizimin"
                >
                  Fshi
                </button>
              </>
            )}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onCancel} aria-label="Anulo">
            Anulo
          </button>
          <button type="submit" className="btn primary" aria-label="Ruaj">
            Ruaj
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditEntryForm;