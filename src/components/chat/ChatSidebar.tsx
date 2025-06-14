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
  Calendar,
  AlertTriangle
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const handleDeleteClick = (sessionId: string) => {
    setShowDeleteConfirm(sessionId);
    setShowDropdown(null);
  };

  const handleConfirmDelete = (sessionId: string) => {
    onDeleteSession(sessionId);
    setShowDeleteConfirm(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
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
                  onClick={() => !editingSessionId && !showDeleteConfirm && onSwitchSession(session.id)}
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
                            {session.is_active && (
                              <span className="ml-2 text-xs bg-lavender-100 text-lavender-700 px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </h3>
                          <p className={`text-xs mt-1 ${
                            session.is_active ? 'text-lavender-600' : 'text-gray-500'
                          }`}>
                            {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </>
                      )}
                    </div>

                    {!editingSessionId && !showDeleteConfirm && (
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
                                  handleDeleteClick(session.id);
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

                  {/* Delete Confirmation Overlay */}
                  <AnimatePresence>
                    {showDeleteConfirm === session.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white rounded-lg border-2 border-red-200 p-3 flex flex-col justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center mb-2">
                          <AlertTriangle size={16} className="text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-900">Delete Chat?</span>
                        </div>
                        <p className="text-xs text-red-700 mb-3">
                          {session.is_active 
                            ? "This will delete your active chat session. You'll be switched to another chat or a new one will be created."
                            : "This action cannot be undone."
                          }
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConfirmDelete(session.id)}
                            className="flex-1 bg-red-600 text-white text-xs py-1.5 px-2 rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="flex-1 bg-gray-200 text-gray-800 text-xs py-1.5 px-2 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {session.is_active && !showDeleteConfirm && (
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