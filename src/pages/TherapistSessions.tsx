import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone, 
  CheckCircle, 
  X, 
  AlertTriangle,
  MessageSquare,
  FileText,
  Filter,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface TherapySession {
  id: string;
  client_id: string;
  session_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  session_format: string;
  total_cost: number;
  client_notes?: string;
  created_at: string;
  client?: {
    full_name: string;
    avatar_url?: string;
  };
}

const TherapistSessions: React.FC = () => {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      console.log('🔍 FETCHING THERAPIST SESSIONS...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      console.log('👨‍⚕️ Current therapist user:', user.id);

      // Get therapist profile
      const { data: therapistProfile, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      
      console.log('🏥 Therapist profile ID:', therapistProfile.id);

      // Get sessions
      const { data, error } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          client:users!therapy_sessions_client_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('therapist_id', therapistProfile.id)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;
      
      console.log('📅 Found sessions for therapist:', data?.length || 0);
      console.log('📋 Session details:', data?.map(s => ({
        id: s.id,
        client: s.client?.full_name,
        status: s.status,
        date: s.scheduled_start,
        cost: s.total_cost
      })));
      
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('therapy_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === sessionId ? { ...session, status } : session
      ));

      toast.success(`Session ${status}`);
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Filter by status
    if (filter === 'upcoming' && !['scheduled', 'confirmed'].includes(session.status)) return false;
    if (filter === 'completed' && session.status !== 'completed') return false;
    if (filter === 'cancelled' && session.status !== 'cancelled') return false;
    
    // Filter by search term
    if (searchTerm && !session.client?.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sessions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600">Manage your therapy sessions and client appointments</p>
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
                    placeholder="Search by client name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        ? 'bg-blue-100 text-blue-800'
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
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any sessions yet." 
                : `No ${filter} sessions found.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          {session.client?.avatar_url ? (
                            <img 
                              src={session.client.avatar_url} 
                              alt={session.client.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {session.client?.full_name || 'Anonymous Client'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                          {session.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ${session.total_cost}
                        </span>
                      </div>
                    </div>
                    
                    {session.client_notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{session.client_notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex space-x-2">
                      {session.status === 'scheduled' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateSessionStatus(session.id, 'confirmed')}
                            leftIcon={<CheckCircle size={16} />}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSessionStatus(session.id, 'cancelled')}
                            leftIcon={<X size={16} />}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {session.status === 'confirmed' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateSessionStatus(session.id, 'completed')}
                            leftIcon={<CheckCircle size={16} />}
                          >
                            Mark Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<MessageSquare size={16} />}
                          >
                            Start Session
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText size={16} />}
                      >
                        Session Notes
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TherapistSessions;