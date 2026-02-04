import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * Settings panel for text-to-speech options: voice selection, rate, and pitch.
 */
const Settings = ({ speech }) => {
    const { supported, voices, selectedVoice, setSelectedVoice, rate, setRate, pitch, setPitch, } = speech;
    if (!supported) {
        return _jsx("p", { children: "Speech synthesis is not supported in this browser." });
    }
    return (_jsxs("div", { style: { borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.5rem' }, children: [_jsx("h3", { style: { margin: '0 0 0.5rem 0', fontSize: '1rem' }, children: "Voice Settings" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "voice-select", children: "Voice" }), _jsx("select", { id: "voice-select", value: selectedVoice?.name || '', onChange: (e) => {
                            const voice = voices.find((v) => v.name === e.target.value);
                            setSelectedVoice(voice ? voice.voice : null);
                        }, children: voices.map((v) => (_jsx("option", { value: v.name, children: `${v.name} (${v.lang})` }, v.name))) })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "rate-range", children: ["Rate: ", rate.toFixed(1)] }), _jsx("input", { type: "range", id: "rate-range", min: "0.5", max: "2", step: "0.1", value: rate, onChange: (e) => setRate(Number(e.target.value)) })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "pitch-range", children: ["Pitch: ", pitch.toFixed(1)] }), _jsx("input", { type: "range", id: "pitch-range", min: "0", max: "2", step: "0.1", value: pitch, onChange: (e) => setPitch(Number(e.target.value)) })] })] }));
};
export default Settings;
