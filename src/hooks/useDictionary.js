import { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadData, saveData } from '@utils/storage';
import { loadCloudConfig } from '@utils/cloudConfig';
import { createEntry, deleteEntryRemote, fetchEntries, updateEntryRemote } from '@utils/dictionaryApi';
/**
 * React hook managing dictionary entries and interactions, including persistence.
 */
export function useDictionary() {
    const [entries, setEntries] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [sortOrder, setSortOrder] = useState('alphabetical');
    const [searchQuery, setSearchQuery] = useState('');
    const [cloudStatus, setCloudStatus] = useState('disabled');
    const [cloudError, setCloudError] = useState('');
    // Load entries from storage on first mount
    useEffect(() => {
        const data = loadData();
        // Ensure missing fields have default values for backwards compatibility
        const normalizedEntries = data.entries.map((e) => ({
            id: e.id,
            word: e.word,
            definition: e.definition,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
            illustration: e.illustration ? e.illustration : '',
            recording: e.recording ?? null,
        }));
        setEntries(normalizedEntries);
    }, []);
    // If cloud sync is configured, pull remote data once on startup.
    useEffect(() => {
        const cfg = loadCloudConfig();
        if (!cfg) {
            setCloudStatus('disabled');
            return;
        }
        // Kick off a sync, but do not block rendering.
        (async () => {
            await syncFromCloud();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Persist entries whenever they change
    useEffect(() => {
        const schema = { version: 1, entries: entries };
        saveData(schema);
    }, [entries]);
    // Normalized map for duplicate detection
    const normalizedMap = useMemo(() => {
        const map = new Map();
        for (const entry of entries) {
            map.set(entry.word.toLowerCase(), entry);
        }
        return map;
    }, [entries]);
    // Sorted and filtered entries
    const visibleEntries = useMemo(() => {
        let filtered = entries;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((e) => e.word.toLowerCase().includes(q));
        }
        if (sortOrder === 'alphabetical') {
            return [...filtered].sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }));
        }
        // Newest first by createdAt
        return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }, [entries, searchQuery, sortOrder]);
    // Selected entry object
    const selectedEntry = useMemo(() => {
        return entries.find((e) => e.id === selectedId) || null;
    }, [entries, selectedId]);
    function addEntry(word, definition, illustration, recording) {
        const normalized = word.trim().toLowerCase();
        if (!normalized) {
            return { success: false, error: 'Fjala nuk mund të jetë bosh.' };
        }
        if (normalizedMap.has(normalized)) {
            return { success: false, error: 'Kjo fjalë ekziston.' };
        }
        const now = Date.now();
        const newEntry = {
            id: uuidv4(),
            word: word.trim(),
            definition: definition.trim(),
            createdAt: now,
            updatedAt: now,
            illustration: illustration.trim(),
            recording: recording || null,
        };
        setEntries((prev) => [...prev, newEntry]);
        setSelectedId(newEntry.id);
        return { success: true };
    }
    /**
     * Add an entry, using the cloud API if configured.
     */
    async function addEntryAsync(word, definition, illustration, recording) {
        const cfg = loadCloudConfig();
        if (!cfg) {
            return addEntry(word, definition, illustration, recording);
        }
        const normalized = word.trim().toLowerCase();
        if (!normalized) {
            return { success: false, error: 'Fjala nuk mund të jetë bosh.' };
        }
        if (normalizedMap.has(normalized)) {
            return { success: false, error: 'Kjo fjalë ekziston.' };
        }
        try {
            const created = await createEntry(cfg, {
                word: word.trim(),
                definition: definition.trim(),
                illustration: illustration.trim(),
                recording: recording || null,
            });
            setEntries((prev) => [...prev, created]);
            setSelectedId(created.id);
            return { success: true };
        }
        catch (err) {
            if (err?.status === 409) {
                return { success: false, error: 'Kjo fjalë ekziston.' };
            }
            return { success: false, error: err?.message || 'Gabim në shtim' };
        }
    }
    function updateEntry(id, word, definition, illustration, recording) {
        const normalized = word.trim().toLowerCase();
        const existing = normalizedMap.get(normalized);
        if (existing && existing.id !== id) {
            return { success: false, error: 'Ekziston një hyrje tjetër me këtë fjalë.' };
        }
        setEntries((prev) => prev.map((entry) => entry.id === id
            ? {
                ...entry,
                word: word.trim(),
                definition: definition.trim(),
                illustration: illustration.trim(),
                recording: recording || null,
                updatedAt: Date.now(),
            }
            : entry));
        return { success: true };
    }
    /** Update an entry, using the cloud API if configured. */
    async function updateEntryAsync(id, word, definition, illustration, recording) {
        const cfg = loadCloudConfig();
        if (!cfg) {
            return updateEntry(id, word, definition, illustration, recording);
        }
        const normalized = word.trim().toLowerCase();
        const existing = normalizedMap.get(normalized);
        if (existing && existing.id !== id) {
            return { success: false, error: 'Ekziston një hyrje tjetër me këtë fjalë.' };
        }
        try {
            const updated = await updateEntryRemote(cfg, id, {
                word: word.trim(),
                definition: definition.trim(),
                illustration: illustration.trim(),
                recording: recording || null,
            });
            setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
            return { success: true };
        }
        catch (err) {
            if (err?.status === 409) {
                return { success: false, error: 'Ekziston një hyrje tjetër me këtë fjalë.' };
            }
            return { success: false, error: err?.message || 'Gabim në ndryshim' };
        }
    }
    function deleteEntry(id) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
        if (selectedId === id) {
            setSelectedId(null);
        }
    }
    /** Delete an entry, using the cloud API if configured. */
    async function deleteEntryAsync(id) {
        const cfg = loadCloudConfig();
        if (!cfg) {
            deleteEntry(id);
            return { success: true };
        }
        try {
            await deleteEntryRemote(cfg, id);
            deleteEntry(id);
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err?.message || 'Gabim në fshirje' };
        }
    }
    /**
     * Pull all entries from the cloud API and replace local state.
     *
     * This is called once at startup if cloud settings exist, and can also be
     * triggered manually.
     */
    async function syncFromCloud() {
        const cfg = loadCloudConfig();
        if (!cfg) {
            setCloudStatus('disabled');
            setCloudError('');
            return { success: false, error: 'Cloud sync is not configured' };
        }
        setCloudStatus('syncing');
        setCloudError('');
        try {
            const remote = await fetchEntries(cfg);
            setEntries(remote);
            setCloudStatus('ready');
            return { success: true };
        }
        catch (err) {
            const msg = err?.message || 'Failed to sync from cloud';
            setCloudStatus('error');
            setCloudError(msg);
            return { success: false, error: msg };
        }
    }
    function importEntries(imported, resolution) {
        let added = 0;
        let skipped = 0;
        let overwritten = 0;
        setEntries((prev) => {
            const map = new Map(prev.map((e) => [e.word.toLowerCase(), e]));
            const next = [...prev];
            for (const item of imported) {
                const key = item.word.toLowerCase();
                const existing = map.get(key);
                if (existing) {
                    if (resolution.strategy === 'skip') {
                        skipped++;
                        continue;
                    }
                    else if (resolution.strategy === 'overwrite') {
                        // replace existing entry
                        overwritten++;
                        const idx = next.findIndex((e) => e.id === existing.id);
                        next[idx] = {
                            ...existing,
                            word: item.word,
                            definition: item.definition,
                            illustration: 'illustration' in item && item.illustration ? item.illustration : existing.illustration,
                            recording: 'recording' in item ? item.recording : existing.recording,
                            updatedAt: Date.now(),
                        };
                    }
                    else if (resolution.strategy === 'keepBoth') {
                        // Create a unique word by appending a suffix
                        let suffix = 1;
                        let newWord = item.word;
                        while (map.has(newWord.toLowerCase())) {
                            suffix++;
                            newWord = `${item.word} (${suffix})`;
                        }
                        const now = Date.now();
                        next.push({
                            id: uuidv4(),
                            word: newWord,
                            definition: item.definition,
                            illustration: 'illustration' in item && item.illustration ? item.illustration : '',
                            recording: 'recording' in item ? item.recording : null,
                            createdAt: now,
                            updatedAt: now,
                        });
                        map.set(newWord.toLowerCase(), next[next.length - 1]);
                        added++;
                    }
                }
                else {
                    // Add new entry
                    const now = Date.now();
                    const newEntry = {
                        id: uuidv4(),
                        word: item.word,
                        definition: item.definition,
                        illustration: 'illustration' in item && item.illustration ? item.illustration : '',
                        recording: 'recording' in item ? item.recording : null,
                        createdAt: now,
                        updatedAt: now,
                    };
                    next.push(newEntry);
                    map.set(key, newEntry);
                    added++;
                }
            }
            return next;
        });
        return { added, skipped, overwritten };
    }
    function exportEntries() {
        const schema = { version: 1, entries: entries };
        return JSON.stringify(schema, null, 2);
    }
    return {
        entries: visibleEntries,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        selectedId,
        setSelectedId,
        selectedEntry,
        addEntry,
        addEntryAsync,
        updateEntry,
        updateEntryAsync,
        deleteEntry,
        deleteEntryAsync,
        importEntries,
        exportEntries,
        syncFromCloud,
        cloudStatus,
        cloudError,
    };
}
