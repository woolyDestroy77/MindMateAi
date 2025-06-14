import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import { ChatSession } from '../../hooks/useChatSessions';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  isLoading: boolean;
  onCreateNew: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSession,
  isLoading,
  onCreateNew,
  onSwitchSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
    setShowDropdown(null);
  };

  const handleSaveEdit = () => {
    if (editingSessionId && editingName.trim()) {
      onRenameSession(editingSessionId, editingName.trim());
    }
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleDelete = (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      onDeleteSession(sessionId);
    }
    setShowDropdown(null);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Button
          variant="primary"
          fullWidth
          onClick={onCreateNew}
          leftIcon={<Plus size={18} />}
          className="mb-4"
        >
          Start New Chat
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageSquare size={20} className="mr-2" />
          Chat History
        </h2>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 text-sm">No chat sessions yet</p>
            <p className="text-gray-500 text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`relative group rounded-lg p-3 cursor-pointer transition-all ${
                    session.is_active
                      ? 'bg-lavender-50 border border-lavender-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !editingSessionId && onSwitchSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className={`text-sm font-medium truncate ${
                            session.is_active ? 'text-lavender-900' : 'text-gray-900'
                          }`}>
                            {session.name}
                          </h3>
                          <p className={`text-xs mt-1 ${
                            session.is_active ? 'text-lavender-600' : 'text-gray-500'
                          }`}>
                            {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </>
                      )}
                    </div>

                    {!editingSessionId && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(showDropdown === session.id ? null : session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                        >
                          <MoreVertical size={16} />
                        </button>

                        <AnimatePresence>
                          {showDropdown === session.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(session);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit2 size={14} className="mr-2" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(session.id);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {session.is_active && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-lavender-500 rounded-r"></div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          {sessions.length} chat session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ChatSidebar;