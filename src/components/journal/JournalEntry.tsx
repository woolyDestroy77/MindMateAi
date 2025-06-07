import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { JournalEntry as JournalEntryType } from '../../hooks/useJournal';

interface JournalEntryProps {
  entry: JournalEntryType;
  onEdit: (entry: JournalEntryType) => void;
  onDelete: (id: string) => void;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ entry, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm text-gray-500">
            {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
          </div>
          <div className="text-2xl mt-1">{entry.mood}</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(entry)}
            className="text-gray-400 hover:text-lavender-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="bg-lavender-50 text-lavender-700 px-2 py-0.5 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default JournalEntry;