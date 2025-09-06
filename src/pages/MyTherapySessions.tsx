import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone, 
  MessageSquare, 
  Star,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  MapPin,
  Award,
  Filter,
  Search,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface TherapySession {
  id: string;
  therapist_id: string;
  session_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  session_format: 'video' | 'phone' | 'in_person';
  total_cost: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  client_notes?: string;
  video_room_id?: string;
  created_at: string;
  therapist?: {
    id: string;
    professional_title: string;
    hourly_rate: number;
    user?: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

const MyTherapySessions: React.FC = () => {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          therapist:therapist_profiles(
            id,
            professional_title,
            hourly_rate,
            user:users!therapist_profiles_user_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('client_id', user.id)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching therapy sessions:', error);
      toast.error('Failed to load your therapy sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSession = async (sessionId: string) => {
    try {
      setIsCancelling(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { error } = await supabase
        .from('therapy_sessions')
        .update({
          status: 'cancelled',
          cancellation_reason: cancelReason,
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('client_id', user.id);

      if (error) throw error;

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'cancelled' as const }
          : session
      ));

      toast.success('Session cancelled successfully');
      setShowCancelModal(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    } finally {
      setIsCancelling(false);
    }
  };

  const joinSession = (session: TherapySession) => {
    if (session.session_format === 'video' && session.video_room_id) {
      // In a real app, this would open the video call interface
      toast.success('Joining video session...');
      // window.open(`/video-call/${session.video_room_id}`, '_blank');
    } else if (session.session_format === 'phone') {
      toast.info('Your therapist will call you at the scheduled time');
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Filter by status
    if (filter === 'upcoming' && !['scheduled', 'confirmed'].includes(session.status)) return false;
    if (filter === 'completed' && session.status !== 'completed') return false;
    if (filter === 'cancelled' && session.status !== 'cancelled') return false;
    
    // Filter by search term
    if (searchTerm && !session.therapist?.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'no_show': return <AlertTriangle className="w-4 h-4" />;
      case 'in_progress': return <Video className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelSession = (session: TherapySession) => {
    const sessionStart = parseISO(session.scheduled_start);
    const now = new Date();
    const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return ['scheduled', 'confirmed'].includes(session.status) && hoursUntilSession > 24;
  };

  const canJoinSession = (session: TherapySession) => {
    const sessionStart = parseISO(session.scheduled_start);
    const sessionEnd = parseISO(session.scheduled_end);
    const now = new Date();
    
    return session.status === 'confirmed' && 
           isAfter(now, addHours(sessionStart, -0.25)) && // 15 minutes before
           isBefore(now, sessionEnd);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your therapy sessions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Therapy Sessions</h1>
              <p className="text-gray-600">Manage your appointments and connect with your therapists</p>
            </div>
            <Link to="/therapists">
              <Button
                variant="primary"
                leftIcon={<Calendar size={18} />}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Book New Session
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by therapist name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                {['all', 'upcoming', 'completed', 'cancelled'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-lavender-100 text-lavender-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't booked any therapy sessions yet." 
                : `No ${filter} sessions found.`}
            </p>
            <Link to="/therapists">
              <Button
                variant="primary"
                leftIcon={<Calendar size={18} />}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Find a Therapist
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {session.therapist?.user?.avatar_url ? (
                            <img 
                              src={session.therapist.user.avatar_url} 
                              alt={session.therapist.user.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-3 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {session.therapist?.user?.full_name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(session.status)}`}>
                              {getStatusIcon(session.status)}
                              <span className="capitalize">{session.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{session.therapist?.professional_title}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{format(parseISO(session.scheduled_start), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{format(parseISO(session.scheduled_start), 'h:mm a')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {session.session_format === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                              <span className="capitalize">{session.session_format}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${session.total_cost}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(session.payment_status)}`}>
                          {session.payment_status.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ${session.total_cost}
                        </span>
                      </div>
                    </div>
                    
                    {session.client_notes && (
                      <div className="mb-4 p-3 bg-lavender-50 rounded-lg border border-lavender-200">
                        <h4 className="text-sm font-medium text-lavender-900 mb-1">Your Notes:</h4>
                        <p className="text-sm text-lavender-800">{session.client_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3">
                      {/* Join Session */}
                      {canJoinSession(session) && (
                        <Button
                          variant="primary"
                          onClick={() => joinSession(session)}
                          leftIcon={session.session_format === 'video' ? <Video size={16} /> : <Phone size={16} />}
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          Join Session
                        </Button>
                      )}
                      
                      {/* Message Therapist */}
                      <Button
                        variant="outline"
                        leftIcon={<MessageSquare size={16} />}
                        onClick={() => {
                          // Navigate to messaging with this therapist
                          const therapistName = session.therapist?.user?.full_name || 'Therapist';
                          console.log('🔍 Message Therapist clicked:', {
                            therapist_id: session.therapist_id,
                            therapist_user: session.therapist?.user,
                            therapist_name: therapistName
                          });
                          
                          // Use the therapist_id from the session (this is the therapist_profiles.id)
                          // We need to get the actual user_id for messaging
                          if (session.therapist_id) {
                            // First get the therapist's user_id
                            supabase
                              .from('therapist_profiles')
                              .select('user_id')
                              .eq('id', session.therapist_id)
                              .single()
                              .then(({ data, error }) => {
                                if (error) {
                                  console.error('Error getting therapist user_id:', error);
                                  toast.error('Failed to open messaging');
                                  return;
                                }
                                
                                if (data?.user_id) {
                                  console.log('✅ Found therapist user_id:', data.user_id);
                                  window.location.href = `/therapist-messages?therapist=${data.user_id}&name=${encodeURIComponent(therapistName)}`;
                                } else {
                                  toast.error('Therapist messaging not available');
                                }
                              });
                          } else {
                            toast.error('Therapist information not available');
                          }
                        }}
                      >
                        Message Therapist
                      </Button>
                      
                      {/* View Therapist Profile */}
                      <Link to={`/therapist/${session.therapist_id}`}>
                        <Button
                          variant="outline"
                          leftIcon={<User size={16} />}
                        >
                          View Profile
                        </Button>
                      </Link>
                      
                      {/* Cancel Session */}
                      {canCancelSession(session) && (
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelModal(session.id)}
                          leftIcon={<X size={16} />}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Cancel Session
                        </Button>
                      )}
                      
                      {/* Session Notes (for completed sessions) */}
                      {session.status === 'completed' && (
                        <Button
                          variant="outline"
                          leftIcon={<FileText size={16} />}
                        >
                          Session Notes
                        </Button>
                      )}
                      
                      {/* Leave Review (for completed sessions) */}
                      {session.status === 'completed' && (
                        <Button
                          variant="outline"
                          leftIcon={<Star size={16} />}
                          className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        >
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Cancel Session Modal */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCancelModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Cancel Session</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to cancel this therapy session? This action cannot be undone.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Please let us know why you're cancelling..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      fullWidth
                       onClick={async () => {
                         const therapistName = session.therapist?.user?.full_name || 'Therapist';
                         console.log('🔍 Message Therapist clicked from session');
                         
                         if (session.therapist_id) {
                           try {
                             const { data, error } = await supabase
                               .from('therapist_profiles')
                               .select('user_id')
                               .eq('id', session.therapist_id)
                               .single();
                               
                             if (error) {
                               console.error('Error getting therapist user_id:', error);
                               toast.error('Failed to open messaging');
                               return;
                             }
                             
                             if (data?.user_id) {
                               console.log('✅ Navigating to messages with therapist:', data.user_id);
                               navigate(`/messages/${data.user_id}?name=${encodeURIComponent(therapistName)}`);
                             } else {
                               toast.error('Therapist messaging not available');
                             }
                           } catch (error) {
                             console.error('Error in messaging navigation:', error);
                             toast.error('Failed to open messaging');
                           }
                         }
                       }}