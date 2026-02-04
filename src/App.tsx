import React, { useState } from 'react';
import { useDictionary, Entry } from '@hooks/useDictionary';
import { useSpeech } from '@hooks/useSpeech';
import { useToast } from '@hooks/useToast';
import BookLayout from '@components/BookLayout';
import AddEditEntryForm from '@components/AddEditEntryForm';
import ToastContainer from '@components/ToastContainer';
import ImportExport from '@components/ImportExport';
import CloudApiSettings from '@components/CloudApiSettings';

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

      {/* Cloud DB/API configuration */}
      <CloudApiSettings
        onToast={showToast}
        onChange={async () => {
          const res = await dict.syncFromCloud();
          if (res.success) showToast('Synced from cloud');
          else showToast(res.error || 'Cloud sync failed');
        }}
      />
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
            const res = await dict.updateEntryAsync(editingEntry.id, word, definition, illustration, recording);
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