const STORAGE_KEY = 'digital_dictionary_v1';
const SCHEMA_VERSION = 1;
/**
 * Load persisted data from localStorage. If the stored data is invalid or a migration
 * fails, this function will return an empty data set without throwing an error.
 */
export function loadData() {
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
        let version = parsed.version;
        let entries = parsed.entries;
        // Basic schema validation
        if (typeof version !== 'number' || !Array.isArray(entries)) {
            return { version: SCHEMA_VERSION, entries: [] };
        }
        // Migrate if necessary
        while (version < SCHEMA_VERSION) {
            ({ version, entries } = migrate(version, entries));
        }
        return { version, entries: entries };
    }
    catch {
        return { version: SCHEMA_VERSION, entries: [] };
    }
}
/**
 * Save the provided data to localStorage.
 */
export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch {
        // Ignore write errors (e.g., storage full) silently.
    }
}
/**
 * Migration handler. In this first version the migration simply bumps the version
 * while preserving entries. Additional migrations can be added as needed.
 */
function migrate(version, entries) {
    switch (version) {
        default:
            // If the version is unknown, just bump to current and drop data.
            return { version: SCHEMA_VERSION, entries: [] };
    }
}
