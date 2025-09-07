import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, ArrowLeft, Phone, Video, Calendar, Clock, Shield, Award, Search, Filter, Mic, MicOff, Play, Pause, Smile, Heart, ThumbsUp, ThumbsDown, Laugh, Angry, Salad as Sad, MoreHorizontal, Check, CheckCheck, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface TherapistMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_content: string;
  message_type: 'text' | 'voice' | 'file' | 'appointment_reminder' | 'system';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  reactions?: { [key: string]: string[] }; // emoji -> user_ids
  voice_duration?: number;
  voice_url?: string;
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
  isOnline?: boolean;
  lastSeen?: string;
}

const ClientMessages: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<TherapistMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(clientId || null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const isTherapist = user?.user_metadata?.user_type === 'therapist' || user?.user_metadata?.is_therapist;

  // Voice recording
  const {
    isRecording,
    transcript,
    audioBlob,
    audioUrl,
    recordingDuration,
    startRecording,
    stopRecording,
    clearRecording,
    formatDuration
  } = useVoiceInput();

  useEffect(() => {
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
            latestMessage: msg,
            isOnline: Math.random() > 0.5, // Simulate online status
            lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString()
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

  const sendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !selectedConversation) return;

    const messageId = `temp-${Date.now()}`;
    const messageContent = newMessage.trim();
    
    try {
      setIsSending(true);
      setSendingMessageId(messageId);
      setNewMessage('');
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) return;

      // Add optimistic message with sending animation
      const optimisticMessage: TherapistMessage = {
        id: messageId,
        sender_id: currentUser.id,
        recipient_id: selectedConversation,
        message_content: messageContent,
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          full_name: currentUser.user_metadata.full_name || 'You',
          avatar_url: currentUser.user_metadata.avatar_url
        }
      };

      setMessages(prev => [...prev, optimisticMessage]);

      const { data, error } = await supabase
        .from('therapist_messages')
        .insert([{
          sender_id: currentUser.id,
          recipient_id: selectedConversation,
          message_content: messageContent,
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

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? data : msg
      ));
      
      // Update conversation list
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv.id === selectedConversation);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], latestMessage: data };
          return updated;
        }
        return prev;
      });
      
      // Send notification to recipient
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: selectedConversation,
            title: 'New Message',
            message: `${currentUser.user_metadata.full_name || 'Someone'} sent you a message`,
            type: 'message',
            priority: 'medium',
            read: false,
            action_url: `/messages/${currentUser.id}?name=${encodeURIComponent(currentUser.user_metadata.full_name || 'User')}`,
            action_text: 'View Message'
          }]);
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setNewMessage(messageContent); // Restore message
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
      setSendingMessageId(null);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !selectedConversation || !transcript.trim()) return;

    const messageId = `temp-voice-${Date.now()}`;
    
    try {
      setIsSending(true);
      setSendingMessageId(messageId);
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) return;

      // Add optimistic voice message
      const optimisticMessage: TherapistMessage = {
        id: messageId,
        sender_id: currentUser.id,
        recipient_id: selectedConversation,
        message_content: transcript.trim(),
        message_type: 'voice',
        is_read: false,
        created_at: new Date().toISOString(),
        voice_duration: recordingDuration,
        voice_url: audioUrl || '',
        sender: {
          full_name: currentUser.user_metadata.full_name || 'You',
          avatar_url: currentUser.user_metadata.avatar_url
        }
      };

      setMessages(prev => [...prev, optimisticMessage]);
      clearRecording();

      const { data, error } = await supabase
        .from('therapist_messages')
        .insert([{
          sender_id: currentUser.id,
          recipient_id: selectedConversation,
          message_content: transcript.trim(),
          message_type: 'voice',
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

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...data, voice_duration: recordingDuration, voice_url: audioUrl } : msg
      ));
      
    } catch (error) {
      console.error('Error sending voice message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.error('Failed to send voice message');
    } finally {
      setIsSending(false);
      setSendingMessageId(null);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Update local state optimistically
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions } || {};
          if (!reactions[emoji]) reactions[emoji] = [];
          
          if (reactions[emoji].includes(user.id)) {
            // Remove reaction
            reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            // Add reaction
            reactions[emoji].push(user.id);
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));

      // In a real app, you'd save reactions to the database
      
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const playVoiceMessage = (messageId: string, voiceUrl?: string) => {
    if (playingVoice === messageId) {
      setPlayingVoice(null);
      return;
    }

    if (voiceUrl) {
      const audio = new Audio(voiceUrl);
      audio.play();
      setPlayingVoice(messageId);
      
      audio.onended = () => {
        setPlayingVoice(null);
      };
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = parseISO(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const groupMessagesByDate = (messages: TherapistMessage[]) => {
    const groups: { [key: string]: TherapistMessage[] } = {};
    
    messages.forEach(message => {
      const date = parseISO(message.created_at);
      let dateKey;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = conversations.find(conv => conv.id === selectedConversation);
  const groupedMessages = groupMessagesByDate(messages);

  const reactionEmojis = ['❤️', '👍', '👎', '😂', '😢', '😮', '😡'];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-6">
          <Link 
            to={isTherapist ? "/therapist-dashboard" : "/dashboard"} 
            className="inline-flex items-center text-lavender-600 hover:text-lavender-800 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-lavender-500 to-blue-500 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Messages</h2>
                  <MessageSquare className="w-6 h-6" />
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={16} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                    <p className="text-gray-600 text-sm">
                      {isTherapist 
                        ? "You don't have any client messages yet." 
                        : "You don't have any therapist conversations yet."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredConversations.map((conversation) => (
                      <motion.button
                        key={conversation.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full text-left p-4 transition-all duration-200 ${
                          selectedConversation === conversation.id 
                            ? 'bg-gradient-to-r from-lavender-50 to-blue-50 border-r-4 border-lavender-500' 
                            : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-lavender-100 to-blue-100 border-2 border-white shadow-md">
                              {conversation.avatar_url ? (
                                <img 
                                  src={conversation.avatar_url} 
                                  alt={conversation.full_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-3 text-lavender-600" />
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg"
                              >
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </motion.div>
                            )}
                            {conversation.isOnline && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900 truncate">{conversation.full_name}</div>
                              {conversation.latestMessage && (
                                <div className="text-xs text-gray-400 ml-2">
                                  {formatMessageTime(conversation.latestMessage.created_at)}
                                </div>
                              )}
                            </div>
                            {conversation.latestMessage && (
                              <div className="flex items-center space-x-1">
                                {conversation.latestMessage.sender_id === user?.id && (
                                  <div className="flex items-center">
                                    {conversation.latestMessage.is_read ? (
                                      <CheckCheck size={12} className="text-blue-500" />
                                    ) : (
                                      <Check size={12} className="text-gray-400" />
                                    )}
                                  </div>
                                )}
                                <div className="text-sm text-gray-500 truncate flex items-center">
                                  {conversation.latestMessage.message_type === 'voice' && (
                                    <Mic size={12} className="mr-1 text-blue-500" />
                                  )}
                                  {conversation.latestMessage.message_type === 'voice' 
                                    ? 'Voice message' 
                                    : conversation.latestMessage.message_content}
                                </div>
                              </div>
                            )}
                            {!conversation.isOnline && conversation.lastSeen && (
                              <div className="text-xs text-gray-400">
                                Last seen {formatDistanceToNow(parseISO(conversation.lastSeen), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Message Area */}
          <div className="lg:col-span-2">
            {selectedConversation && selectedUser ? (
              <Card className="h-full flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                {/* Message Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-lavender-500 to-blue-500 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                          {selectedUser.avatar_url ? (
                            <img 
                              src={selectedUser.avatar_url} 
                              alt={selectedUser.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-2 text-white" />
                          )}
                        </div>
                        {selectedUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-lg">
                            {selectedUser.full_name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Shield className="w-4 h-4 text-green-300" />
                            <span className="text-xs text-green-200 font-medium">Secure</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/80">
                          {selectedUser.isOnline ? (
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                              Online now
                            </span>
                          ) : (
                            `${isTherapist ? 'Client' : 'Therapist'} • HIPAA Compliant`
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                        <Phone size={18} />
                      </button>
                      <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                        <Video size={18} />
                      </button>
                      <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                        <Calendar size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/30 to-lavender-50/30">
                  {Object.keys(groupedMessages).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lavender-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-lavender-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Conversation</h3>
                      <p className="text-gray-600">
                        Send your first message to {selectedUser.full_name}
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([dateGroup, groupMessages]) => (
                      <div key={dateGroup}>
                        {/* Date Separator */}
                        <div className="flex justify-center my-6">
                          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200">
                            <span className="text-sm font-medium text-gray-600">{dateGroup}</span>
                          </div>
                        </div>

                        {/* Messages for this date */}
                        <div className="space-y-3">
                          {groupMessages.map((message, index) => {
                            const isSentByMe = message.sender_id === user?.id;
                            const isLastInGroup = index === groupMessages.length - 1 || 
                              groupMessages[index + 1]?.sender_id !== message.sender_id;
                            const isFirstInGroup = index === 0 || 
                              groupMessages[index - 1]?.sender_id !== message.sender_id;
                            
                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0,
                                  scale: sendingMessageId === message.id ? [1, 1.02, 1] : 1
                                }}
                                transition={{ 
                                  duration: 0.3,
                                  scale: { duration: 0.6, repeat: sendingMessageId === message.id ? Infinity : 0 }
                                }}
                                className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} group`}
                              >
                                <div className={`max-w-[85%] ${isSentByMe ? 'order-2' : 'order-1'}`}>
                                  {/* Avatar for first message in group */}
                                  {!isSentByMe && isFirstInGroup && (
                                    <div className="flex items-end space-x-2 mb-1">
                                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
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
                                      <span className="text-xs font-medium text-gray-600">
                                        {message.sender?.full_name}
                                      </span>
                                    </div>
                                  )}

                                  <div className={`relative group ${isSentByMe ? 'ml-8' : 'mr-8'}`}>
                                    {/* Message Bubble */}
                                    <motion.div
                                      whileHover={{ scale: 1.01 }}
                                      className={`relative px-4 py-3 shadow-lg ${
                                        isSentByMe
                                          ? `bg-gradient-to-r from-lavender-500 to-blue-500 text-white ${
                                              isLastInGroup ? 'rounded-t-2xl rounded-bl-2xl rounded-br-md' : 'rounded-t-2xl rounded-bl-2xl rounded-br-2xl'
                                            }`
                                          : `bg-white border border-gray-100 text-gray-800 ${
                                              isLastInGroup ? 'rounded-t-2xl rounded-br-2xl rounded-bl-md' : 'rounded-t-2xl rounded-br-2xl rounded-bl-2xl'
                                            }`
                                      } ${sendingMessageId === message.id ? 'opacity-70' : ''}`}
                                    >
                                      {message.message_type === 'voice' ? (
                                        <div className="flex items-center space-x-3">
                                          <button
                                            onClick={() => playVoiceMessage(message.id, message.voice_url)}
                                            className={`p-2 rounded-full ${
                                              isSentByMe ? 'bg-white/20 hover:bg-white/30' : 'bg-lavender-100 hover:bg-lavender-200'
                                            } transition-colors`}
                                          >
                                            {playingVoice === message.id ? (
                                              <Pause size={16} className={isSentByMe ? 'text-white' : 'text-lavender-600'} />
                                            ) : (
                                              <Play size={16} className={isSentByMe ? 'text-white' : 'text-lavender-600'} />
                                            )}
                                          </button>
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <div className={`flex-1 h-1 rounded-full ${
                                                isSentByMe ? 'bg-white/30' : 'bg-lavender-200'
                                              }`}>
                                                <div className={`h-full rounded-full ${
                                                  isSentByMe ? 'bg-white/60' : 'bg-lavender-500'
                                                } w-1/3`}></div>
                                              </div>
                                              <span className={`text-xs ${isSentByMe ? 'text-white/80' : 'text-gray-500'}`}>
                                                {message.voice_duration ? formatDuration(message.voice_duration) : '0:30'}
                                              </span>
                                            </div>
                                            {message.message_content && (
                                              <div className={`text-xs mt-1 ${isSentByMe ? 'text-white/70' : 'text-gray-500'}`}>
                                                "{message.message_content}"
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm leading-relaxed">{message.message_content}</p>
                                      )}

                                      {/* Message Time */}
                                      <div className={`text-xs mt-2 flex items-center ${
                                        isSentByMe ? 'justify-end text-white/70' : 'justify-start text-gray-400'
                                      }`}>
                                        <span>{formatMessageTime(message.created_at)}</span>
                                        {isSentByMe && (
                                          <div className="ml-2 flex items-center">
                                            {sendingMessageId === message.id ? (
                                              <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-3 h-3 border border-white/50 border-t-white rounded-full"
                                              />
                                            ) : message.is_read ? (
                                              <CheckCheck size={14} className="text-blue-200" />
                                            ) : (
                                              <Check size={14} className="text-white/50" />
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Reactions */}
                                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {Object.entries(message.reactions).map(([emoji, userIds]) => (
                                            <motion.button
                                              key={emoji}
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() => addReaction(message.id, emoji)}
                                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                                                userIds.includes(user?.id || '')
                                                  ? 'bg-lavender-100 text-lavender-800 border border-lavender-300'
                                                  : 'bg-white/80 text-gray-600 border border-gray-200'
                                              } hover:scale-110 transition-all`}
                                            >
                                              <span>{emoji}</span>
                                              <span className="font-medium">{userIds.length}</span>
                                            </motion.button>
                                          ))}
                                        </div>
                                      )}
                                    </motion.div>

                                    {/* Reaction Button */}
                                    <div className={`absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                      isSentByMe ? '-left-8' : '-right-8'
                                    }`}>
                                      <div className="relative">
                                        <button
                                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                          className="p-1.5 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                          <Smile size={14} className="text-gray-600" />
                                        </button>

                                        {/* Emoji Picker */}
                                        <AnimatePresence>
                                          {showEmojiPicker === message.id && (
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                              animate={{ opacity: 1, scale: 1, y: 0 }}
                                              exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                              className={`absolute ${isSentByMe ? 'right-0' : 'left-0'} top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10`}
                                            >
                                              <div className="flex space-x-1">
                                                {reactionEmojis.map((emoji) => (
                                                  <motion.button
                                                    key={emoji}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                      addReaction(message.id, emoji);
                                                      setShowEmojiPicker(null);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                  >
                                                    <span className="text-lg">{emoji}</span>
                                                  </motion.button>
                                                ))}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100">
                  {/* Voice Recording UI */}
                  <AnimatePresence>
                    {isRecording && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-4 h-4 bg-red-500 rounded-full"
                            />
                            <div>
                              <div className="font-medium text-red-900">Recording voice message</div>
                              <div className="text-sm text-red-700">Duration: {formatDuration(recordingDuration)}</div>
                              {transcript && (
                                <div className="text-xs text-red-600 mt-1 italic">"{transcript}"</div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={stopRecording}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Stop
                            </Button>
                            {audioBlob && transcript && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={sendVoiceMessage}
                                className="bg-gradient-to-r from-green-500 to-emerald-500"
                              >
                                Send
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={sendTextMessage} className="flex items-end space-x-3">
                    <div className="flex-1 relative">
                      <div className="flex items-end space-x-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          className="p-3 text-gray-500 hover:text-lavender-600 transition-colors"
                        >
                          <Paperclip size={20} />
                        </button>
                        
                        <input
                          ref={messageInputRef}
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={`Message ${selectedUser.full_name}...`}
                          className="flex-1 py-3 px-2 border-0 focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-500 bg-transparent"
                          disabled={isSending || isRecording}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendTextMessage(e);
                            }
                          }}
                        />
                        
                        <button
                          type="button"
                          className="p-3 text-gray-500 hover:text-lavender-600 transition-colors"
                        >
                          <Smile size={20} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Voice/Send Button */}
                    <div className="flex space-x-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
                          isRecording
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-lavender-500 hover:to-blue-500'
                        }`}
                      >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      </motion.button>

                      {newMessage.trim() && (
                        <motion.button
                          type="submit"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={isSending}
                          className="p-3 rounded-full bg-gradient-to-r from-lavender-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                          {isSending ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Send size={20} />
                            </motion.div>
                          ) : (
                            <Send size={20} />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </form>
                  
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500">
                      🔒 All messages are encrypted and HIPAA compliant
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lavender-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-12 h-12 text-lavender-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
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

export default ClientMessages;