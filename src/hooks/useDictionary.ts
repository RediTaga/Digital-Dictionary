import { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadData, saveData, DataSchema, EntryRecord } from '@utils/storage';
import { loadCloudConfig } from '@utils/cloudConfig';
import { createEntry, deleteEntryRemote, fetchEntries, updateEntryRemote } from '@utils/dictionaryApi';

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
  strategy: 'skip' | 'overwrite' | 'keepBoth';
}

/**
 * Admin auth: store passphrase only in sessionStorage (not localStorage).
 * This is not "high security" (admin could leak it), but the real protection is the server env var.
 */
const ADMIN_SESSION_KEY = 'dd_admin_passphrase';

function getAdminPassphrase(): string {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
  } catch {
    return '';
  }
}

function setAdminPassphrase(passphrase: string) {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, passphrase);
  } catch {
    // ignore
  }
}

function clearAdminPassphrase() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * React hook managing dictionary entries and interactions, including persistence.
 */
export function useDictionary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cloudStatus, setCloudStatus] = useState<'disabled' | 'syncing' | 'ready' | 'error'>('disabled');
  const [cloudError, setCloudError] = useState<string>('');

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Load entries from storage on first mount
  useEffect(() => {
    const data = loadData();
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

  // Initialize admin flag from session
  useEffect(() => {
    setIsAdmin(!!getAdminPassphrase());
  }, []);

  // If cloud sync is configured, pull remote data once on startup.
  useEffect(() => {
    const cfg = loadCloudConfig();
    if (!cfg) {
      setCloudStatus('disabled');
      return;
    }
    (async () => {
      await syncFromCloud();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, searchQuery, sortOrder]);

  // Selected entry object
  const selectedEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedId) || null;
  }, [entries, selectedId]);

  function requireAdmin(): { ok: true } | { ok: false; error: string } {
    if (isAdmin) return { ok: true };
    return { ok: false, error: 'Vetëm admin mund të shtojë/ndryshojë/fshijë fjalë.' };
  }

  function addEntry(
    word: string,
    definition: string,
    illustration: string,
    recording: string | null,
  ): { success: boolean; error?: string } {
    const admin = requireAdmin();
    if (!admin.ok) return { success: false, error: admin.error };

    const normalized = word.trim().toLowerCase();
    if (!normalized) return { success: false, error: 'Fjala nuk mund të jetë bosh.' };
    if (normalizedMap.has(normalized)) return { success: false, error: 'Kjo fjalë ekziston.' };

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

  /**
   * Add an entry, using the cloud API if configured.
   */
  async function addEntryAsync(
    word: string,
    definition: string,
    illustration: string,
    recording: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    const admin = requireAdmin();
    if (!admin.ok) return { success: false, error: admin.error };

    const cfg = loadCloudConfig();
    if (!cfg) {
      return addEntry(word, definition, illustration, recording);
    }

    // Inject admin passphrase into cfg for write calls (dictionaryApi reads cfg.passphrase -> X-Passphrase)
    const pass = getAdminPassphrase();
    const cfgWithAdmin = { ...cfg, passphrase: pass };

    const normalized = word.trim().toLowerCase();
    if (!normalized) return { success: false, error: 'Fjala nuk mund të jetë bosh.' };
    if (normalizedMap.has(normalized)) return { success: false, error: 'Kjo fjalë ekziston.' };

    try {
      const created = await createEntry(cfgWithAdmin as any, {
        word: word.trim(),
        definition: definition.trim(),
        illustration: illustration.trim(),
        recording: recording || null,
      });
      setEntries((prev) => [...prev, created]);
      setSelectedId(created.id);
      return { success: true };
    } catch (err: any) {
      if (err?.status === 401) return { success: false, error: 'Admin key gabim ose mungon.' };
      if (err?.status === 409) return { success: false, error: 'Kjo fjalë ekziston.' };
      return { success: false, error: err?.message || 'Gabim në shtim' };
    }
  }

  function updateEntry(
    id: string,
    word: string,
    definition: string,
    illustration: string,
    recording: string | null,
  ): { success: boolean; error?: string } {
    const admin = requireAdmin();
    if (!admin.ok) return { success: false, error: admin.error };

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

  /** Update an entry, using the cloud API if configured. */
  async function updateEntryAsync(
    id: string,
    word: string,
    definition: string,
    illustration: string,
    recording: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    const admin = requireAdmin();
    if (!admin.ok) return { success: false, error: admin.error };

    const cfg = loadCloudConfig();
    if (!cfg) {
      return updateEntry(id, word, definition, illustration, recording);
    }

    const pass = getAdminPassphrase();
    const cfgWithAdmin = { ...cfg, passphrase: pass };

    const normalized = word.trim().toLowerCase();
    const existing = normalizedMap.get(normalized);
    if (existing && existing.id !== id) {
      return { success: false, error: 'Ekziston një hyrje tjetër me këtë fjalë.' };
    }

    try {
      const updated = await updateEntryRemote(cfgWithAdmin as any, id, {
        word: word.trim(),
        definition: definition.trim(),
        illustration: illustration.trim(),
        recording: recording || null,
      });
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return { success: true };
    } catch (err: any) {
      if (err?.status === 401) return { success: false, error: 'Admin key gabim ose mungon.' };
      if (err?.status === 409) return { success: false, error: 'Ekziston një hyrje tjetër me këtë fjalë.' };
      return { success: false, error: err?.message || 'Gabim në ndryshim' };
    }
  }

  function deleteEntry(id: string): void {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  /** Delete an entry, using the cloud API if configured. */
  async function deleteEntryAsync(id: string): Promise<{ success: boolean; error?: string }> {
    const admin = requireAdmin();
    if (!admin.ok) return { success: false, error: admin.error };

    const cfg = loadCloudConfig();
    if (!cfg) {
      deleteEntry(id);
      return { success: true };
    }

    const pass = getAdminPassphrase();
    const cfgWithAdmin = { ...cfg, passphrase: pass };

    try {
      await deleteEntryRemote(cfgWithAdmin as any, id);
      deleteEntry(id);
      return { success: true };
    } catch (err: any) {
      if (err?.status === 401) return { success: false, error: 'Admin key gabim ose mungon.' };
      return { success: false, error: err?.message || 'Gabim në fshirje' };
    }
  }

  /**
   * Pull all entries from the cloud API and replace local state.
   */
  async function syncFromCloud(): Promise<{ success: boolean; error?: string }> {
    const cfg = loadCloudConfig();
    if (!cfg) {
      setCloudStatus('disabled');
      setCloudError('');
      return { success: false, error: 'Cloud sync is not configured' };
    }
    setCloudStatus('syncing');
    setCloudError('');
    try {
      // Reads do not require admin passphrase
      const remote = await fetchEntries(cfg as any);
      setEntries(remote);
      setCloudStatus('ready');
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sync from cloud';
      setCloudStatus('error');
      setCloudError(msg);
      return { success: false, error: msg };
    }
  }

  // Admin helpers exposed to UI
  async function adminLogin(passphrase: string): Promise<{ success: boolean; error?: string }> {
    const pass = (passphrase || '').trim();
    if (!pass) return { success: false, error: 'Shkruaj admin key.' };

    // We validate by doing a harmless write-protected call: try to create + immediately delete a temp entry is messy,
    // so we instead just store and let the first write action prove it. Simple UX.
    setAdminPassphrase(pass);
    setIsAdmin(true);
    return { success: true };
  }

  function adminLogout(): void {
    clearAdminPassphrase();
    setIsAdmin(false);
  }

  function importEntries(
    imported: Entry[],
    resolution: ImportConflictResolution,
  ): { added: number; skipped: number; overwritten: number } {
    // Keep import/export as a local admin-like tool; you can also admin-gate it if you want.
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

    // Admin
    isAdmin,
    adminLogin,
    adminLogout,

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
