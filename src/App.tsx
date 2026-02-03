import React, { useState } from 'react';
import { useDictionary, Entry } from '@hooks/useDictionary';
import { useSpeech } from '@hooks/useSpeech';
import { useToast } from '@hooks/useToast';
import BookLayout from '@components/BookLayout';
import AddEditEntryForm from '@components/AddEditEntryForm';
import ToastContainer from '@components/ToastContainer';

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
      {/* Add / Edit form overlay */}
      {isAddOpen && (
        <AddEditEntryForm
          title="Shto Fjalë"
          initial={null}
          onSave={(word, definition, illustration, recording) => {
            const result = dict.addEntry(word, definition, illustration, recording);
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
          onSave={(word, definition, illustration, recording) => {
            const res = dict.updateEntry(editingEntry.id, word, definition, illustration, recording);
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