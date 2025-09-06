import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  User, 
  ArrowLeft, 
  Phone, 
  Video,
  Calendar,
  Clock,
  Shield,
  Award,
  Search,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface TherapistMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_content: string;
  message_type: 'text' | 'file' | 'appointment_reminder' | 'system';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ConversationUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  user_type?: string;
  unreadCount: number;
  latestMessage?: TherapistMessage;
}

const TherapistMessages: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<TherapistMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(clientId || null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [targetTherapistId, setTargetTherapistId] = useState<string | null>(null);
  const [targetTherapistName, setTargetTherapistName] = useState<string>('');

  const isTherapist = user?.user_metadata?.user_type === 'therapist' || user?.user_metadata?.is_therapist;

  useEffect(() => {
    // Check if we're trying to message a specific therapist from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const therapistIdFromUrl = urlParams.get('therapist');
    const therapistNameFromUrl = urlParams.get('name');
    
    console.log('🔍 TherapistMessages URL params:', {
      therapistId: therapistIdFromUrl,
      therapistName: therapistNameFromUrl,
      currentUser: user?.id
    });
    
    if (therapistIdFromUrl && therapistNameFromUrl) {
      console.log('✅ Setting target therapist from URL params');
      setTargetTherapistId(therapistIdFromUrl);
      setTargetTherapistName(decodeURIComponent(therapistNameFromUrl));
      setSelectedConversation(therapistIdFromUrl);
    }
    
    if (user) {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) return;

      // Get all messages for this user
      const { data: allMessages, error } = await supabase
        .from('therapist_messages')
        .select(`
          *,
          sender:users!therapist_messages_sender_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          recipient:users!therapist_messages_recipient_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process conversations
      const conversationMap = new Map<string, ConversationUser>();
      
      allMessages?.forEach(msg => {
        const partnerId = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id;
        const partner = msg.sender_id === currentUser.id ? msg.recipient : msg.sender;
        
        if (!partner) return;
        
        const existing = conversationMap.get(partnerId);
        const isUnread = msg.recipient_id === currentUser.id && !msg.is_read;
        
        if (!existing) {
          conversationMap.set(partnerId, {
            id: partnerId,
            full_name: partner.full_name,
            avatar_url: partner.avatar_url,
            unreadCount: isUnread ? 1 : 0,
            latestMessage: msg
          });
        } else {
          if (isUnread) {
            existing.unreadCount += 1;
          }
          
          if (new Date(msg.created_at) > new Date(existing.latestMessage?.created_at || '')) {
            existing.latestMessage = msg;
          }
        }
      });
      
      const conversationList = Array.from(conversationMap.values())
        .sort((a, b) => 
          new Date(b.latestMessage?.created_at || '').getTime() - 
          new Date(a.latestMessage?.created_at || '').getTime()
        );
      
      setConversations(conversationList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('therapist_messages')
        .select(`
          *,
          sender:users!therapist_messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === currentUser.id && !msg.is_read
      ) || [];

      if (unreadMessages.length > 0) {
        await supabase
          .from('therapist_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));
          
        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.id === partnerId 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow sending to either existing conversation or target therapist
    const recipientId = selectedConversation || targetTherapistId;
    if (!newMessage.trim() || isSending || !recipientId) return;

    try {
      setIsSending(true);
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) return;

      console.log('📤 Sending message:', {
        sender: currentUser.id,
        recipient: recipientId,
        message: newMessage.trim()
      });
      const { data, error } = await supabase
        .from('therapist_messages')
        .insert([{
          sender_id: currentUser.id,
          recipient_id: recipientId,
          message_content: newMessage.trim(),
          message_type: 'text',
          is_read: false
        }])
        .select(`
          *,
          sender:users!therapist_messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      console.log('✅ Message sent successfully:', data);
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // If this was a new conversation, set it as selected and clear target
      if (!selectedConversation && targetTherapistId) {
        setSelectedConversation(targetTherapistId);
        setTargetTherapistId(null);
        setTargetTherapistName('');
      }
      
      // Update conversation list
      setConversations(prev => prev.map(conv => 
        conv.id === recipientId 
          ? { ...conv, latestMessage: data }
          : conv
      ));
      
      // Send notification to recipient
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: recipientId,
            title: 'New Message',
            message: `${currentUser.user_metadata.full_name || 'Someone'} sent you a message`,
            type: 'message',
            priority: 'medium',
            read: false,
            action_url: `/therapist-messages/${currentUser.id}`,
            action_text: 'View Message'
          }]);
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      // Refresh conversations to show the new one
      await fetchConversations();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = conversations.find(conv => conv.id === selectedConversation);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isTherapist ? 'Client Messages' : 'Therapist Messages'}
                  </h2>
                  <MessageSquare className="w-5 h-5 text-lavender-600" />
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                    <p className="text-gray-600 text-sm">
                      {isTherapist 
                        ? "You don't have any client messages yet." 
                        : "You don't have any therapist conversations yet."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-lavender-50 border-r-2 border-lavender-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-lavender-100">
                              {conversation.avatar_url ? (
                                <img 
                                  src={conversation.avatar_url} 
                                  alt={conversation.full_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-2 text-lavender-600" />
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{conversation.full_name}</div>
                            {conversation.latestMessage && (
                              <div className="text-sm text-gray-500 truncate">
                                {conversation.latestMessage.sender_id === user?.id ? 'You: ' : ''}
                                {conversation.latestMessage.message_content}
                              </div>
                            )}
                            {conversation.latestMessage && (
                              <div className="text-xs text-gray-400">
                                {formatDistanceToNow(parseISO(conversation.latestMessage.created_at), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Message Area */}
          <div className="lg:col-span-2">
            {selectedConversation && (selectedUser || targetTherapistId) ? (
              <Card className="h-full flex flex-col">
                {/* Message Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100">
                        {(selectedUser?.avatar_url) ? (
                          <img 
                            src={selectedUser.avatar_url} 
                            alt={selectedUser.full_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-full h-full p-2 text-lavender-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {selectedUser?.full_name || targetTherapistName}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Secure</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {isTherapist ? 'Client' : 'Therapist'} • HIPAA Compliant Messaging
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {isTherapist && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Phone size={16} />}
                          >
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Video size={16} />}
                          >
                            Video
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Calendar size={16} />}
                      >
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                      <p className="text-gray-600">
                        Start a conversation with {selectedUser?.full_name || targetTherapistName}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isSentByMe = message.sender_id === user?.id;
                      
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${
                            isSentByMe 
                              ? 'bg-lavender-500 text-white' 
                              : 'bg-white border border-gray-200'
                          } p-4 rounded-lg shadow-sm`}>
                            <div className="flex items-start space-x-3">
                              {!isSentByMe && (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                  {message.sender?.avatar_url ? (
                                    <img 
                                      src={message.sender.avatar_url} 
                                      alt={message.sender.full_name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-full h-full p-1 text-gray-400" />
                                  )}
                                </div>
                              )}
                              
                              <div className="flex-1">
                                {!isSentByMe && (
                                  <div className="font-medium text-sm text-gray-900 mb-1">
                                    {message.sender?.full_name}
                                  </div>
                                )}
                                <p className={`text-sm ${isSentByMe ? 'text-white' : 'text-gray-800'}`}>
                                  {message.message_content}
                                </p>
                                <div className={`text-xs mt-2 ${isSentByMe ? 'text-lavender-200' : 'text-gray-500'}`}>
                                  {formatDistanceToNow(parseISO(message.created_at), { addSuffix: true })}
                                  {isSentByMe && message.is_read && (
                                    <span className="ml-2">• Read</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedUser?.full_name || targetTherapistName}...`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      disabled={isSending}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!newMessage.trim() || isSending}
                      isLoading={isSending}
                      leftIcon={<Send size={16} />}
                    >
                      Send
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    All messages are encrypted and HIPAA compliant
                  </p>
                </form>
              </Card>
            ) : targetTherapistId ? (
              <Card className="h-full flex flex-col">
                {/* New Conversation Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100">
                      <User className="w-full h-full p-2 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{targetTherapistName}</h3>
                      <p className="text-sm text-gray-600">Start a new conversation</p>
                    </div>
                  </div>
                </div>

                {/* Empty Messages Area */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Conversation</h3>
                    <p className="text-gray-600">Send your first message to {targetTherapistName}</p>
                  </div>
                </div>
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">
                    Choose a conversation from the left to start messaging
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

                {/* Message Input for New Conversation */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Send your first message to ${targetTherapistName}...`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      disabled={isSending}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!newMessage.trim() || isSending}
                      isLoading={isSending}
                      leftIcon={<Send size={16} />}
                    >
                      Send
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    All messages are encrypted and HIPAA compliant
                  </p>
                </form>
              </Card>
            ) : (
export default TherapistMessages;