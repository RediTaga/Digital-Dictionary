/**
 * Dictionary entry representation used for persistence. Keep this definition here to avoid
 * a circular dependency between hooks and utils. It mirrors the structure defined in
 * useDictionary.ts but remains isolated for storage purposes.
 */
export interface EntryRecord {
  id: string;
  word: string;
  definition: string;
  createdAt: number;
  updatedAt: number;
  /**
   * Illustration sentence used to show the word in context. Required for every entry.
   */
  illustration: string;
  /**
   * User's recorded audio for this entry encoded as a Data URL (base64). Optional.
   */
  recording?: string | null;
}

/**
 * Schema for persisted data. Adding a version field allows safe migrations in the future.
 */
export interface DataSchema {
  version: number;
  entries: EntryRecord[];
}

const STORAGE_KEY = 'digital_dictionary_v1';
const SCHEMA_VERSION = 1;

/**
 * Load persisted data from localStorage. If the stored data is invalid or a migration
 * fails, this function will return an empty data set without throwing an error.
 */
export function loadData(): DataSchema {
  if (typeof localStorage === 'undefined') {
    return { version: SCHEMA_VERSION, entries: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: SCHEMA_VERSION, entries: [] };
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { version: SCHEMA_VERSION, entries: [] };
    }
    let version: number = parsed.version;
    let entries: unknown = parsed.entries;
    // Basic schema validation
    if (typeof version !== 'number' || !Array.isArray(entries)) {
      return { version: SCHEMA_VERSION, entries: [] };
    }
    // Migrate if necessary
    while (version < SCHEMA_VERSION) {
      ({ version, entries } = migrate(version, entries));
    }
    return { version, entries: entries as EntryRecord[] };
  } catch {
    return { version: SCHEMA_VERSION, entries: [] };
  }
}

/**
 * Save the provided data to localStorage.
 */
export function saveData(data: DataSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore write errors (e.g., storage full) silently.
  }
}

/**
 * Migration handler. In this first version the migration simply bumps the version
 * while preserving entries. Additional migrations can be added as needed.
 */
function migrate(version: number, entries: unknown): { version: number; entries: unknown } {
  switch (version) {
    default:
      // If the version is unknown, just bump to current and drop data.
      return { version: SCHEMA_VERSION, entries: [] };
  }
}