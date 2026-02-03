import React from 'react';
import { useSpeech } from '@hooks/useSpeech';

interface Props {
  speech: ReturnType<typeof useSpeech>;
}

/**
 * Settings panel for text-to-speech options: voice selection, rate, and pitch.
 */
const Settings: React.FC<Props> = ({ speech }) => {
  const {
    supported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
  } = speech;
  if (!supported) {
    return <p>Speech synthesis is not supported in this browser.</p>;
  }
  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.5rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Voice Settings</h3>
      <div className="form-group">
        <label htmlFor="voice-select">Voice</label>
        <select
          id="voice-select"
          value={selectedVoice?.name || ''}
          onChange={(e) => {
            const voice = voices.find((v) => v.name === e.target.value);
            setSelectedVoice(voice ? voice.voice : null);
          }}
        >
          {voices.map((v) => (
            <option key={v.name} value={v.name}>{`${v.name} (${v.lang})`}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="rate-range">Rate: {rate.toFixed(1)}</label>
        <input
          type="range"
          id="rate-range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="pitch-range">Pitch: {pitch.toFixed(1)}</label>
        <input
          type="range"
          id="pitch-range"
          min="0"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default Settings;