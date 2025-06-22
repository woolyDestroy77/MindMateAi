import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Search } from 'lucide-react';
import Button from '../ui/Button';
import { useBlogSocial, BlogMessage } from '../../hooks/useBlogSocial';
import { useAuth } from '../../hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string | null;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ 
  isOpen, 
  onClose,
  recipientId
}) => {
  const { user } = useAuth();
  const { messages, following, sendMessage, markMessageAsRead, deleteMessage } = useBlogSocial();
  
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(recipientId);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeConversation, setActiveConversation] = useState<BlogMessage[]>([]);
  
  // Filter following users by search term
  const filteredFollowing = following.filter(f => 
    f.following?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group messages by conversation
  useEffect(() => {
    if (selectedRecipient) {
      const conversation = messages.filter(msg => 
        (msg.sender_id === user?.id && msg.recipient_id === selectedRecipient) ||
        (msg.sender_id === selectedRecipient && msg.recipient_id === user?.id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setActiveConversation(conversation);
      
      // Mark unread messages as read
      conversation.forEach(msg => {
        if (msg.recipient_id === user?.id && !msg.is_read) {
          markMessageAsRead(msg.id);
        }
      });
    } else {
      setActiveConversation([]);
    }
  }, [selectedRecipient, messages, user, markMessageAsRead]);
  
  // Set recipient from prop if provided
  useEffect(() => {
    if (recipientId) {
      setSelectedRecipient(recipientId);
    }
  }, [recipientId]);
  
  // Get unique conversation partners
  const getConversationPartners = () => {
    const partners = new Map();
    
    messages.forEach(msg => {
      const partnerId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
      const partner = msg.sender_id === user?.id ? msg.recipient : msg.sender;
      
      if (partnerId !== user?.id && partner) {
        // Get the most recent message timestamp
        const existingPartner = partners.get(partnerId);
        if (!existingPartner || new Date(msg.created_at) > new Date(existingPartner.lastMessageAt)) {
          partners.set(partnerId, {
            id: partnerId,
            full_name: partner.full_name,
            avatar_url: partner.avatar_url,
            lastMessageAt: msg.created_at,
            unreadCount: msg.recipient_id === user?.id && !msg.is_read 
              ? (existingPartner?.unreadCount || 0) + 1 
              : (existingPartner?.unreadCount || 0)
          });
        }
      }
    });
    
    return Array.from(partners.values()).sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  };
  
  const conversationPartners = getConversationPartners();
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecipient || !messageText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await sendMessage(selectedRecipient, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSelectRecipient = (userId: string) => {
    setSelectedRecipient(userId);
    setSearchTerm('');
  };
  
  // Get recipient name
  const getRecipientName = () => {
    if (!selectedRecipient) return '';
    
    // Check in conversation partners
    const partner = conversationPartners.find(p => p.id === selectedRecipient);
    if (partner) return partner.full_name;
    
    // Check in following
    const followingUser = following.find(f => f.following_id === selectedRecipient);
    if (followingUser?.following) return followingUser.following.full_name;
    
    return 'User';
  };

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
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-full">
              {/* Conversations Sidebar */}
              <div className="w-1/3 border-r border-gray-200 h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Messages</h3>
                </div>
                
                {/* Search Users */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
                
                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {searchTerm ? (
                    // Show search results
                    filteredFollowing.length > 0 ? (
                      filteredFollowing.map(f => (
                        <button
                          key={f.following_id}
                          onClick={() => handleSelectRecipient(f.following_id)}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                            selectedRecipient === f.following_id ? 'bg-lavender-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {f.following?.avatar_url ? (
                                <img 
                                  src={f.following.avatar_url} 
                                  alt={f.following.full_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-2 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{f.following?.full_name}</div>
                              <div className="text-xs text-gray-500">Following</div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No users found matching "{searchTerm}"
                      </div>
                    )
                  ) : (
                    // Show conversation partners
                    conversationPartners.length > 0 ? (
                      conversationPartners.map(partner => (
                        <button
                          key={partner.id}
                          onClick={() => handleSelectRecipient(partner.id)}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                            selectedRecipient === partner.id ? 'bg-lavender-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
                              {partner.avatar_url ? (
                                <img 
                                  src={partner.avatar_url} 
                                  alt={partner.full_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-2 text-gray-400" />
                              )}
                              {partner.unreadCount > 0 && (
                                <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                  {partner.unreadCount > 9 ? '9+' : partner.unreadCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{partner.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(partner.lastMessageAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No conversations yet
                      </div>
                    )
                  )}
                </div>
              </div>
              
              {/* Message Area */}
              <div className="w-2/3 flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="font-semibold text-gray-900">
                    {selectedRecipient ? getRecipientName() : 'New Message'}
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
                  {selectedRecipient ? (
                    activeConversation.length > 0 ? (
                      activeConversation.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${
                            msg.sender_id === user?.id 
                              ? 'bg-lavender-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                              : 'bg-gray-100 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                          } p-3 relative group`}>
                            <p>{msg.message}</p>
                            <div className={`text-xs ${msg.sender_id === user?.id ? 'text-lavender-100' : 'text-gray-500'} mt-1`}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </div>
                            
                            {msg.sender_id === user?.id && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete message"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <p>No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>Select a user to message</p>
                        <p className="text-sm">or search for someone to start a new conversation</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                {selectedRecipient && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        disabled={!selectedRecipient || isSubmitting}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!messageText.trim() || !selectedRecipient || isSubmitting}
                        isLoading={isSubmitting}
                        className="bg-lavender-600 hover:bg-lavender-700"
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SendMessageModal;