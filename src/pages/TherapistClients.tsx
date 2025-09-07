import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Star,
  Phone,
  Mail,
  User,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Client {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  totalSessions: number;
  lastSession?: string;
  nextSession?: string;
  averageRating?: number;
}

const TherapistClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Get therapist profile
      const { data: therapistProfile, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get unique clients from sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('therapy_sessions')
        .select(`
          client_id,
          scheduled_start,
          status,
          client:users!therapy_sessions_client_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('therapist_id', therapistProfile.id)
        .order('scheduled_start', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Process clients data
      const clientsMap = new Map<string, Client>();
      
      sessions?.forEach(session => {
        if (!session.client) return;
        
        const clientId = session.client.id;
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: clientId,
            full_name: session.client.full_name,
            email: session.client.email,
            avatar_url: session.client.avatar_url,
            totalSessions: 0,
            lastSession: undefined,
            nextSession: undefined
          });
        }
        
        const client = clientsMap.get(clientId)!;
        client.totalSessions++;
        
        // Update last session
        if (session.status === 'completed' && 
            (!client.lastSession || session.scheduled_start > client.lastSession)) {
          client.lastSession = session.scheduled_start;
        }
        
        // Update next session
        if (['scheduled', 'confirmed'].includes(session.status) && 
            new Date(session.scheduled_start) > new Date() &&
            (!client.nextSession || session.scheduled_start < client.nextSession)) {
          client.nextSession = session.scheduled_start;
        }
      });

      setClients(Array.from(clientsMap.values()));
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
          <p className="text-gray-600">Manage your client relationships and session history</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "No clients match your search criteria." 
                : "You don't have any clients yet. Start accepting bookings to see clients here."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full">
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                        {client.avatar_url ? (
                          <img 
                            src={client.avatar_url} 
                            alt={client.full_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-full h-full p-3 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Sessions:</span>
                        <span className="font-medium">{client.totalSessions}</span>
                      </div>
                      
                      {client.lastSession && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Session:</span>
                          <span className="font-medium">
                            {format(parseISO(client.lastSession), 'MMM d')}
                          </span>
                        </div>
                      )}
                      
                      {client.nextSession && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Next Session:</span>
                          <span className="font-medium text-blue-600">
                            {format(parseISO(client.nextSession), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        leftIcon={<MessageSquare size={16} />}
                        onClick={() => {
                          console.log('🔍 Message Client clicked from therapist clients page');
                          console.log('Client ID:', client.id);
                          console.log('Client Name:', client.full_name);
                          
                          // Navigate to client messages with the client's user ID
                          window.location.href = `/messages/${client.id}?name=${encodeURIComponent(client.full_name)}`;
                        }}
                      >
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        leftIcon={<FileText size={16} />}
                      >
                        Notes
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

export default TherapistClients;