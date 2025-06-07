import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import JournalEntryModal from '../components/journal/JournalEntryModal';
import JournalEntry from '../components/journal/JournalEntry';
import { useJournal, JournalEntry as JournalEntryType } from '../hooks/useJournal';

const Journal = () => {
  const { entries, isLoading, addEntry, updateEntry, deleteEntry } = useJournal();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryType | null>(null);

  const handleSubmit = async (content: string, mood: string, tags: string[]) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, { content, mood, tags });
      setEditingEntry(null);
    } else {
      await addEntry(content, mood, tags);
    }
    setShowEntryModal(false);
  };

  const handleEdit = (entry: JournalEntryType) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
          <Button
            variant="primary"
            onClick={() => {
              setEditingEntry(null);
              setShowEntryModal(true);
            }}
            leftIcon={<Plus size={20} />}
          >
            New Entry
          </Button>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your journal entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
              <p className="text-gray-600 mb-4">Start journaling to track your emotional journey.</p>
              <Button
                variant="primary"
                onClick={() => setShowEntryModal(true)}
                leftIcon={<Plus size={20} />}
              >
                Create Your First Entry
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {entries.map(entry => (
                <JournalEntry
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      <JournalEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
        initialContent={editingEntry?.content}
        initialMood={editingEntry?.mood}
        initialTags={editingEntry?.tags}
      />
    </div>
  );
};

export default Journal;