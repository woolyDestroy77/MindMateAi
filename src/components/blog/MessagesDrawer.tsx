import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Send, ArrowLeft, Clock, Check, CheckCheck } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Button from '../ui/Button';
import { useBlogSocial, DirectMessage } from '../../hooks/useBlogSocial';
import { useAuth } from '../../hooks/useAuth';

interface MessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessagesDrawer: React.FC<MessagesDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    conversationUsers, 
    activeConversation, 
    setConversation, 
    getConversationMessages, 
    sendMessage, 
    markMessageAsRead,
    refreshMessages
  } = useBlogSocial();
  
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<DirectMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get active conversation user
  const activeUser = conversationUsers.find(u => u.id === activeConversation);
  
  // Update conversation messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      const messages = getConversationMessages(activeConversation);
      setConversationMessages(messages);
      
      // Mark unread messages as read
      messages.forEach(msg => {
        if (msg.recipient_id === user?.id && !msg.is_read) {
          markMessageAsRead(msg.id);
        }
      });
    } else {
      setConversationMessages([]);
    }
  }, [activeConversation, getConversationMessages, user, markMessageAsRead]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);
  
  // Refresh messages periodically
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        refreshMessages();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [isOpen, refreshMessages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeConversation || !newMessage.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await sendMessage(activeConversation, newMessage.trim());
      setNewMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = parseISO(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-80 md:w-96 bg-white shadow-xl z-50 flex flex-col"
        >
          <div className="p-4 border-b bg-lavender-50 flex justify-between items-center">
            {activeConversation ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setConversation(null)}
                  className="p-1 rounded-full hover:bg-lavender-100"
                >
                  <ArrowLeft size={20} className="text-lavender-600" />
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-lavender-100">
                    {activeUser?.avatar_url ? (
                      <img 
                        src={activeUser.avatar_url} 
                        alt={activeUser.full_name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200";
                        }}
                      />
                    ) : (
                      <User className="w-full h-full p-1.5 text-lavender-600" />
                    )}
                  </div>
                  <div className="font-medium text-gray-900">{activeUser?.full_name}</div>
                </div>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          {activeConversation ? (
            <>
              {/* Conversation View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-lavender-100 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={24} className="text-lavender-600" />
                    </div>
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start the conversation with {activeUser?.full_name}</p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isSentByMe = msg.sender_id === user?.id;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isSentByMe ? 'bg-lavender-500 text-white' : 'bg-white text-gray-800'} p-3 rounded-lg shadow-sm`}>
                          <p className="text-sm">{msg.message}</p>
                          <div className={`text-xs mt-1 flex items-center justify-end ${isSentByMe ? 'text-lavender-200' : 'text-gray-500'}`}>
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {isSentByMe && (
                              <span className="ml-1">
                                {msg.is_read ? (
                                  <CheckCheck size={12} />
                                ) : (
                                  <Check size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeUser?.full_name}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newMessage.trim() || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversationUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-lavender-100 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={24} className="text-lavender-600" />
                    </div>
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start a conversation with someone</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {conversationUsers.map((user) => (
                      <button
                        key={user.id}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        onClick={() => setConversation(user.id)}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-lavender-100">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.full_name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200";
                                }}
                              />
                            ) : (
                              <User className="w-full h-full p-2 text-lavender-600" />
                            )}
                          </div>
                          {user.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                              {user.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.latestMessage.sender_id === user.id ? '' : 'You: '}
                            {user.latestMessage.message}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatDistanceToNow(parseISO(user.latestMessage.created_at), { addSuffix: true })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add MessageSquare component since it's used but not imported
const MessageSquare = (props: any) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
};

export default MessagesDrawer;