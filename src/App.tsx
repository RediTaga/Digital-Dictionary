import React, { useEffect, useState } from 'react';
import { useDictionary, Entry } from '@hooks/useDictionary';
import { useSpeech } from '@hooks/useSpeech';
import { useToast } from '@hooks/useToast';
import BookLayout from '@components/BookLayout';
import AddEditEntryForm from '@components/AddEditEntryForm';
import ToastContainer from '@components/ToastContainer';
import ImportExport from '@components/ImportExport';

/**
 * Root application component.
 */
const App: React.FC = () => {
  const dict = useDictionary();
  const speech = useSpeech();
  const { toasts, showToast } = useToast();

  // Form state for adding/editing entries
  const [isAddOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Auto-sync once on load (no UI buttons)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await dict.syncFromCloud();
        if (cancelled) return;

        if (res.success) {
          // Keep this quiet or show a toast; your choice.
          // showToast('Synced from cloud');
        } else {
          showToast(res.error || 'Cloud sync failed');
        }
      } catch (err: any) {
        if (cancelled) return;
        showToast(err?.message || 'Cloud sync failed');
      }
    })();

    return () => {
      cancelled = true;
    };
    // We want this to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <BookLayout
        dictionary={dict}
        speech={speech}
        onAdd={() => setAddOpen(true)}
        onEdit={(entry) => setEditingEntry(entry)}
        onToast={showToast}
      />

      {/* Local JSON import/export */}
      <ImportExport dictionary={dict} onToast={showToast} />

      {/* Add / Edit form overlay */}
      {isAddOpen && (
        <AddEditEntryForm
          title="Shto Fjalë"
          initial={null}
          onSave={async (word, definition, illustration, recording) => {
            const result = await dict.addEntryAsync(word, definition, illustration, recording);
            if (!result.success) {
              showToast(result.error || 'Gabim në shtim');
              return false;
            }
            showToast('Fjala u shtua');
            setAddOpen(false);
            return true;
          }}
          onCancel={() => setAddOpen(false)}
        />
      )}

      {editingEntry && (
        <AddEditEntryForm
          title="Modifiko Fjalë"
          initial={editingEntry}
          onSave={async (word, definition, illustration, recording) => {
            const res = await dict.updateEntryAsync(
              editingEntry.id,
              word,
              definition,
              illustration,
              recording
            );
            if (!res.success) {
              showToast(res.error || 'Gabim në ndryshim');
              return false;
            }
            showToast('Fjala u ndryshua');
            setEditingEntry(null);
            return true;
          }}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
};

export default App;
