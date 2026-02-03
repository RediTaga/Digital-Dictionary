import { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadData, saveData, DataSchema, EntryRecord } from '@utils/storage';

export interface Entry {
  id: string;
  word: string;
  definition: string;
  createdAt: number;
  updatedAt: number;
  illustration: string;
  /**
   * Data URL representing the recorded audio for this entry. Can be null if not recorded.
   */
  recording?: string | null;
}

export type SortOrder = 'alphabetical' | 'newest';

export interface ImportConflictResolution {
  // When duplicate exists, choose how to handle: skip, overwrite existing, or keep both (with suffix on import)
  strategy: 'skip' | 'overwrite' | 'keepBoth';
}

/**
 * React hook managing dictionary entries and interactions, including persistence.
 */
export function useDictionary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load entries from storage on first mount
  useEffect(() => {
    const data = loadData();
    // Ensure missing fields have default values for backwards compatibility
    const normalizedEntries: Entry[] = data.entries.map((e) => ({
      id: e.id,
      word: e.word,
      definition: e.definition,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      illustration: (e as any).illustration ? (e as any).illustration : '',
      recording: (e as any).recording ?? null,
    }));
    setEntries(normalizedEntries);
  }, []);

  // Persist entries whenever they change
  useEffect(() => {
    const schema: DataSchema = { version: 1, entries: entries as EntryRecord[] };
    saveData(schema);
  }, [entries]);

  // Normalized map for duplicate detection
  const normalizedMap = useMemo(() => {
    const map = new Map<string, Entry>();
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

  function addEntry(
    word: string,
    definition: string,
    illustration: string,
    recording: string | null,
  ): { success: boolean; error?: string } {
    const normalized = word.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Fjala nuk mund të jetë bosh.' };
    }
    if (normalizedMap.has(normalized)) {
      return { success: false, error: 'Kjo fjalë ekziston.' };
    }
    const now = Date.now();
    const newEntry: Entry = {
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

  function updateEntry(
    id: string,
    word: string,
    definition: string,
    illustration: string,
    recording: string | null,
  ): { success: boolean; error?: string } {
    const normalized = word.trim().toLowerCase();
    const existing = normalizedMap.get(normalized);
    if (existing && existing.id !== id) {
      return { success: false, error: 'Ekziston një hyrje tjetër me këtë fjalë.' };
    }
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              word: word.trim(),
              definition: definition.trim(),
              illustration: illustration.trim(),
              recording: recording || null,
              updatedAt: Date.now(),
            }
          : entry,
      ),
    );
    return { success: true };
  }

  function deleteEntry(id: string): void {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  function importEntries(
    imported: Entry[],
    resolution: ImportConflictResolution,
  ): { added: number; skipped: number; overwritten: number } {
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
          } else if (resolution.strategy === 'overwrite') {
            // replace existing entry
            overwritten++;
            const idx = next.findIndex((e) => e.id === existing.id);
            next[idx] = {
              ...existing,
              word: item.word,
              definition: item.definition,
              illustration: 'illustration' in item && item.illustration ? item.illustration : existing.illustration,
              recording: 'recording' in item ? (item as any).recording : existing.recording,
              updatedAt: Date.now(),
            };
          } else if (resolution.strategy === 'keepBoth') {
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
              recording: 'recording' in item ? (item as any).recording : null,
              createdAt: now,
              updatedAt: now,
            });
            map.set(newWord.toLowerCase(), next[next.length - 1]);
            added++;
          }
        } else {
          // Add new entry
          const now = Date.now();
          const newEntry: Entry = {
            id: uuidv4(),
            word: item.word,
            definition: item.definition,
            illustration: 'illustration' in item && item.illustration ? item.illustration : '',
            recording: 'recording' in item ? (item as any).recording : null,
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

  function exportEntries(): string {
    const schema: DataSchema = { version: 1, entries: entries as EntryRecord[] };
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
    updateEntry,
    deleteEntry,
    importEntries,
    exportEntries,
  };
}