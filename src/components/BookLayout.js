import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import DictionaryIndex from '@components/DictionaryIndex';
import EntryDetails from '@components/EntryDetails';
/**
 * Layout component representing the pages of a book. Displays the index on the left
 * and the entry details on the right. On mobile screens, a tabbed interface is shown.
 */
const BookLayout = ({ dictionary, speech, onAdd, onEdit, onToast }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeTab, setActiveTab] = useState('index');
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
    return (_jsxs("div", { className: "book", role: "region", "aria-label": "Digital dictionary book", children: [isMobile && (_jsxs("div", { style: { display: 'flex', justifyContent: 'center', padding: '0.5rem', gap: '0.5rem' }, children: [_jsx("button", { className: `btn ${activeTab === 'index' ? 'primary' : 'secondary'}`, onClick: () => setActiveTab('index'), children: "Indeks" }), _jsx("button", { className: `btn ${activeTab === 'details' ? 'primary' : 'secondary'}`, onClick: () => setActiveTab('details'), children: "Faqe" })] })), _jsx("div", { className: "page", style: { display: isMobile ? (activeTab === 'index' ? 'block' : 'none') : 'block' }, children: _jsx(DictionaryIndex, { dictionary: dictionary, onAdd: onAdd, onEdit: onEdit }) }), _jsx("div", { className: "spine", "aria-hidden": "true" }), _jsx("div", { className: "page", style: { display: isMobile ? (activeTab === 'details' ? 'block' : 'none') : 'block' }, children: _jsx(EntryDetails, { dictionary: dictionary, speech: speech, onEdit: onEdit, onToast: onToast }) })] }));
};
export default BookLayout;
