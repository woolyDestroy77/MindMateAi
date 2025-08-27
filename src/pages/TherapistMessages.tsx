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
  Award
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

interface TherapistProfile {
  id: string;
  professional_title: string;
  years_experience: number;
  license_state: string;
  hourly_rate: number;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

const TherapistMessages: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<TherapistMessage[]>([]);
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (therapistId) {
      fetchTherapist();
      fetchMessages();
    }
  }, [therapistId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTherapist = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          user:users!therapist_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('id', therapistId)
        .single();

      if (error) throw error;
      setTherapist(data);
    } catch (error) {
      console.error('Error fetching therapist:', error);
      toast.error('Therapist not found');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Get therapist user ID
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select('user_id')
        .eq('id', therapistId)
        .single();

      if (therapistError) throw therapistError;

      const { data, error } = await supabase
        .from('therapist_messages')
        .select(`
          *,
          sender:users!therapist_messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${therapistData.user_id}),and(sender_id.eq.${therapistData.user_id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.is_read
      ) || [];

      if (unreadMessages.length > 0) {
        await supabase
          .from('therapist_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));
      }
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('therapist_messages_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'therapist_messages',
          filter: `recipient_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 New message received:', payload);
          
          // Fetch the new message with sender data
          supabase
            .from('therapist_messages')
            .select(`
              *,
              sender:users!therapist_messages_sender_id_fkey(
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data: newMessage }) => {
              if (newMessage) {
                setMessages(prev => [...prev, newMessage]);
                toast.success('New message received');
              }
            });
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !therapist) return;

    try {
      setIsSending(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Get therapist user ID
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select('user_id')
        .eq('id', therapistId)
        .single();

      if (therapistError) throw therapistError;

      const { data, error } = await supabase
        .from('therapist_messages')
        .insert([{
          sender_id: user.id,
          recipient_id: therapistData.user_id,
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

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Send notification to therapist
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: therapistData.user_id,
            title: 'New Message from Client',
            message: `${user.user_metadata.full_name || 'A client'} sent you a message`,
            type: 'message',
            priority: 'medium',
            read: false,
            action_url: `/therapist-messages/${user.id}`,
            action_text: 'View Message'
          }]);
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading conversation...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Therapist Not Found</h2>
            <p className="text-gray-600 mb-6">The therapist you're trying to message is not available.</p>
            <Link to="/my-therapy-sessions">
              <Button
                variant="primary"
                leftIcon={<ArrowLeft size={18} />}
              >
                Back to Sessions
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="mb-6">
          <Link to="/my-therapy-sessions" className="inline-flex items-center text-lavender-600 hover:text-lavender-800 mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Back to My Sessions
          </Link>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {therapist.user?.avatar_url ? (
                      <img 
                        src={therapist.user.avatar_url} 
                        alt={therapist.user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-2 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {therapist.user?.full_name}
                      </h2>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{therapist.professional_title}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span>{therapist.years_experience} years</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>${therapist.hourly_rate}/hour</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link to={`/book-session/${therapist.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Calendar size={16} />}
                    >
                      Book Session
                    </Button>
                  </Link>
                  <Link to={`/therapist/${therapist.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<User size={16} />}
                    >
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Messages */}
        <Card className="h-[calc(100vh-300px)] flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-lavender-600" />
              <h3 className="font-semibold text-gray-900">Secure Messaging</h3>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">HIPAA Compliant</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
                <p className="text-gray-600">Start a conversation with your therapist</p>
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
                    <div className={`max-w-[80%] ${isSentByMe ? 'bg-lavender-500 text-white' : 'bg-white border border-gray-200'} p-4 rounded-lg shadow-sm`}>
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
                placeholder={`Message ${therapist.user?.full_name}...`}
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
      </main>
    </div>
  );
};

export default TherapistMessages;