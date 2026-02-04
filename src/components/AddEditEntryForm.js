import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
/**
 * Form for adding or editing a dictionary entry. Appears as a modal overlay.
 */
const AddEditEntryForm = ({ title, initial, onSave, onCancel }) => {
    const [word, setWord] = useState(initial?.word || '');
    const [definition, setDefinition] = useState(initial?.definition || '');
    const [illustration, setIllustration] = useState(initial?.illustration || '');
    const [recordingData, setRecordingData] = useState(initial?.recording ?? null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = React.useRef(null);
    const audioChunksRef = React.useRef([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
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
                    const base64 = reader.result;
                    setRecordingData(base64);
                };
                reader.readAsDataURL(audioBlob);
            };
            mediaRecorder.start();
            setIsRecording(true);
        }
        catch (err) {
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
    async function handleSubmit(e) {
        e.preventDefault();
        const newErrors = {};
        const trimmedWord = word.trim();
        const trimmedDef = definition.trim();
        const trimmedIll = illustration.trim();
        if (!trimmedWord) {
            newErrors.word = 'Fjala është e detyrueshme.';
        }
        else if (trimmedWord.length > 60) {
            newErrors.word = 'Fjala duhet të ketë deri në 60 karaktere.';
        }
        if (!trimmedDef) {
            newErrors.definition = 'Përkufizimi është i detyrueshëm.';
        }
        else if (trimmedDef.length > 2000) {
            newErrors.definition = 'Përkufizimi duhet të ketë deri në 2000 karaktere.';
        }
        if (!trimmedIll) {
            newErrors.illustration = 'Ilustrimi është i detyrueshëm.';
        }
        else if (trimmedIll.length > 500) {
            newErrors.illustration = 'Ilustrimi duhet të ketë deri në 500 karaktere.';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            try {
                setIsSaving(true);
                const success = await onSave(trimmedWord, trimmedDef, trimmedIll, recordingData);
                if (!success) {
                    // Error already handled via toast from parent
                    return;
                }
            }
            finally {
                setIsSaving(false);
            }
        }
    }
    return (_jsx("div", { style: {
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
        }, children: _jsxs("form", { onSubmit: handleSubmit, style: {
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }, children: [_jsx("h2", { style: { marginTop: 0 }, children: title }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "word-input", children: "Fjal\u00EB" }), _jsx("input", { id: "word-input", type: "text", value: word, onChange: (e) => setWord(e.target.value), "aria-required": "true" }), errors.word && _jsx("div", { style: { color: 'red', fontSize: '0.875rem' }, children: errors.word })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "definition-input", children: "P\u00EBrkufizim" }), _jsx("textarea", { id: "definition-input", value: definition, onChange: (e) => setDefinition(e.target.value), rows: 4, "aria-required": "true" }), errors.definition && _jsx("div", { style: { color: 'red', fontSize: '0.875rem' }, children: errors.definition })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "illustration-input", children: "Ilustrim (fjal\u00EB n\u00EB fjali)" }), _jsx("textarea", { id: "illustration-input", value: illustration, onChange: (e) => setIllustration(e.target.value), rows: 3, "aria-required": "true" }), errors.illustration && _jsx("div", { style: { color: 'red', fontSize: '0.875rem' }, children: errors.illustration })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "In\u00E7izim audio" }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', alignItems: 'center' }, children: [!isRecording && (_jsx("button", { type: "button", className: "btn secondary", onClick: startRecording, "aria-label": "Regjistro audio", children: "Regjistro" })), isRecording && (_jsx("button", { type: "button", className: "btn danger", onClick: stopRecording, "aria-label": "Ndalo regjistrimin", children: "Ndalo" })), recordingData && !isRecording && (_jsxs(_Fragment, { children: [_jsx("audio", { src: recordingData, controls: true, style: { maxWidth: '200px' } }), _jsx("button", { type: "button", className: "btn secondary", onClick: () => {
                                                setRecordingData(null);
                                            }, "aria-label": "Fshi in\u00E7izimin", children: "Fshi" })] }))] })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "button", className: "btn secondary", onClick: onCancel, "aria-label": "Anulo", disabled: isSaving, children: "Anulo" }), _jsx("button", { type: "submit", className: "btn primary", "aria-label": "Ruaj", disabled: isSaving, children: isSaving ? 'Duke ruajtur...' : 'Ruaj' })] })] }) }));
};
export default AddEditEntryForm;
