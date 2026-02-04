import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * Displays the dictionary index: search/filter box, sort options, and list of words.
 */
const DictionaryIndex = ({ dictionary, onAdd }) => {
    const { entries, sortOrder, setSortOrder, searchQuery, setSearchQuery, selectedId, setSelectedId, } = dictionary;
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }, children: [_jsx("input", { type: "search", placeholder: "K\u00EBrko...", "aria-label": "K\u00EBrko fjal\u00EB", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: { flex: 1, marginRight: '0.5rem' } }), _jsx("button", { className: "btn primary", onClick: onAdd, "aria-label": "Shto fjal\u00EB", children: "Shto" })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }, children: [_jsx("label", { className: "sr-only", htmlFor: "sort-select", children: "Rendit sipas" }), _jsxs("select", { id: "sort-select", value: sortOrder, onChange: (e) => setSortOrder(e.target.value), "aria-label": "Rendit hyrjet", children: [_jsx("option", { value: "alphabetical", children: "A \u2192 Zh" }), _jsx("option", { value: "newest", children: "M\u00EB t\u00EB rejat" })] })] }), _jsx("ul", { className: "entry-list", role: "listbox", "aria-label": "Lista e fjal\u00EBve", children: entries.map((entry) => (_jsx("li", { tabIndex: 0, onClick: () => setSelectedId(entry.id), onKeyDown: (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedId(entry.id);
                        }
                    }, className: entry.id === selectedId ? 'selected' : '', "aria-selected": entry.id === selectedId, children: entry.word }, entry.id))) })] }));
};
export default DictionaryIndex;
