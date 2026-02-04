import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * Shows details of the selected entry, along with controls to edit, delete, and speak.
 */
const EntryDetails = ({ dictionary, speech, onEdit, onToast }) => {
    const { selectedEntry, deleteEntryAsync } = dictionary;
    const { supported, speak, stop } = speech;
    if (!selectedEntry) {
        // Show an Albanian prompt when no entry is selected
        return _jsx("p", { children: "Zgjidhni nj\u00EB fjal\u00EB nga indeksi p\u00EBr t\u00EB par\u00EB p\u00EBrkufizimin." });
    }
    const { id, word, definition, illustration, recording } = selectedEntry;
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }, children: [_jsx("h2", { style: { margin: 0 }, children: word }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem' }, children: [supported ? (_jsx("button", { className: "btn secondary", onClick: () => {
                                    // If already speaking, stop and restart
                                    if (recording) {
                                        // play recorded audio
                                        const audio = new Audio(recording);
                                        audio.play();
                                    }
                                    else {
                                        speech.stop();
                                        speak(`${word}. ${definition}`);
                                    }
                                }, "aria-label": `Dëgjo ${word}`, children: "\uD83D\uDD0A" })) : (_jsx("span", { title: "Speech synthesis not supported", children: "\uD83D\uDD07" })), _jsx("button", { className: "btn secondary", onClick: () => onEdit(selectedEntry), "aria-label": "Modifiko fjal\u00EBn", children: "Modifiko" }), _jsx("button", { className: "btn danger", onClick: async () => {
                                    if (confirm('Të fshihet kjo fjalë?')) {
                                        const res = await deleteEntryAsync(id);
                                        if (res.success) {
                                            onToast('Fjala u fshi');
                                        }
                                        else {
                                            onToast(res.error || 'Gabim në fshirje');
                                        }
                                    }
                                }, "aria-label": "Fshij fjal\u00EBn", children: "Fshij" })] })] }), _jsx("p", { style: { whiteSpace: 'pre-wrap' }, children: definition }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("strong", { children: "Ilustrim:" }), _jsx("p", { style: { whiteSpace: 'pre-wrap', marginTop: '0.25rem' }, children: illustration })] })] }));
};
export default EntryDetails;
