import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Search, Trash2, MessageSquare } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Button from '../ui/Button';
import { DirectMessage, useBlogSocial } from '../../hooks/useBlogSocial';
import { useAuth } from '../../hooks/useAuth';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: DirectMessage[];
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ isOpen, onClose, messages }) => {
  const { user } = useAuth();
  const { sendMessage, markMessageAsRead, deleteMessage } = useBlogSocial();
  
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string} | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeConversations, setActiveConversations] = useState<{id: string, name: string, avatar?: string}[]>([]);
  
  // Extract unique conversations from messages
  useEffect(() => {
    if (!user) return;
    
    const conversations = new Map<string, {id: string, name: string, avatar?: string}>();
    
    messages.forEach(msg => {
      if (msg.sender_id === user.id && msg.recipient) {
        if (!conversations.has(msg.recipient_id)) {
          conversations.set(msg.recipient_id, {
            id: msg.recipient_id,
            name: msg.recipient.full_name,
            avatar: msg.recipient.avatar_url
          });
        }
      } else if (msg.recipient_id === user.id && msg.sender) {
        if (!conversations.has(msg.sender_id)) {
          conversations.set(msg.sender_id, {
            id: msg.sender_id,
            name: msg.sender.full_name,
            avatar: msg.sender.avatar_url
          });
        }
      }
    });
    
    setActiveConversations(Array.from(conversations.values()));
  }, [messages, user]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedUser && user) {
      const unreadMessages = messages.filter(
        msg => msg.sender_id === selectedUser.id && 
               msg.recipient_id === user.id && 
               !msg.is_read
      );
      
      unreadMessages.forEach(msg => {
        markMessageAsRead(msg.id);
      });
    }
  }, [selectedUser, messages, user, markMessageAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !messageText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await sendMessage(selectedUser.id, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(messageId);
    }
  };

  // Filter conversations by search term
  const filteredConversations = searchTerm
    ? activeConversations.filter(conv => 
        conv.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : activeConversations;

  // Get messages for selected conversation
  const conversationMessages = selectedUser
    ? messages.filter(msg => 
        (msg.sender_id === user?.id && msg.recipient_id === selectedUser.id) ||
        (msg.sender_id === selectedUser.id && msg.recipient_id === user?.id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-full">
              {/* Conversations Sidebar */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-lavender-600" />
                    Messages
                  </h2>
                  <div className="mt-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredConversations.map(conv => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedUser({ id: conv.id, name: conv.name })}
                          className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left ${
                            selectedUser?.id === conv.id ? 'bg-lavender-50' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                            {conv.avatar ? (
                              <img 
                                src={conv.avatar} 
                                alt={conv.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-full h-full p-2 text-lavender-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{conv.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {getLastMessage(conv.id)}
                            </div>
                          </div>
                          {getUnreadCount(conv.id) > 0 && (
                            <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {getUnreadCount(conv.id)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Conversation Area */}
              <div className="w-2/3 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {selectedUser ? (
                      <>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
                      </>
                    ) : (
                      <h2 className="text-lg font-semibold text-gray-900">Select a conversation</h2>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!selectedUser ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>Select a conversation to view messages</p>
                      </div>
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation by sending a message below</p>
                      </div>
                    </div>
                  ) : (
                    conversationMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] group ${
                          msg.sender_id === user?.id ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block relative p-3 rounded-lg ${
                            msg.sender_id === user?.id
                              ? 'bg-lavender-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {msg.message}
                            
                            {msg.sender_id === user?.id && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete message"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Message Input */}
                {selectedUser && (
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!messageText.trim() || isSubmitting}
                        isLoading={isSubmitting}
                        leftIcon={<Send size={16} />}
                      >
                        Send
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Helper function to get last message for a conversation
  function getLastMessage(userId: string): string {
    const conversationMsgs = messages.filter(msg => 
      (msg.sender_id === user?.id && msg.recipient_id === userId) ||
      (msg.sender_id === userId && msg.recipient_id === user?.id)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (conversationMsgs.length === 0) return 'No messages yet';
    
    const lastMsg = conversationMsgs[0];
    const preview = lastMsg.message.length > 20 
      ? lastMsg.message.substring(0, 20) + '...' 
      : lastMsg.message;
    
    return lastMsg.sender_id === user?.id 
      ? `You: ${preview}` 
      : preview;
  }

  // Helper function to get unread count for a conversation
  function getUnreadCount(userId: string): number {
    return messages.filter(msg => 
      msg.sender_id === userId && 
      msg.recipient_id === user?.id && 
      !msg.is_read
    ).length;
  }
};

export default SendMessageModal;