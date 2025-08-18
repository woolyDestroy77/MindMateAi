import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone, 
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';

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
  therapist?: {
    id: string;
    professional_title: string;
    user?: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

interface TherapySessionCardProps {
  sessions: TherapySession[];
  isLoading: boolean;
}

const TherapySessionCard: React.FC<TherapySessionCardProps> = ({ sessions, isLoading }) => {
  if (isLoading) {
    return (
      <Card variant="elevated" className="h-full">
        <div className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Get next upcoming session
  const upcomingSessions = sessions
    .filter(session => 
      ['scheduled', 'confirmed'].includes(session.status) && 
      isAfter(parseISO(session.scheduled_start), new Date())
    )
    .sort((a, b) => parseISO(a.scheduled_start).getTime() - parseISO(b.scheduled_start).getTime());

  const nextSession = upcomingSessions[0];

  // Get recent completed sessions
  const recentSessions = sessions
    .filter(session => session.status === 'completed')
    .sort((a, b) => parseISO(b.scheduled_start).getTime() - parseISO(a.scheduled_start).getTime())
    .slice(0, 2);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canJoinSession = (session: TherapySession) => {
    const sessionStart = parseISO(session.scheduled_start);
    const sessionEnd = parseISO(session.scheduled_end);
    const now = new Date();
    
    return session.status === 'confirmed' && 
           isAfter(now, addHours(sessionStart, -0.25)) && // 15 minutes before
           isBefore(now, sessionEnd);
  };

  if (sessions.length === 0) {
    return (
      <Card variant="elevated" className="h-full">
        <div className="p-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-lavender-600" />
            Therapy Sessions
          </h2>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Booked</h3>
            <p className="text-gray-600 mb-4">
              Connect with a licensed therapist for professional support
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
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="h-full">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-lavender-600" />
            Therapy Sessions
          </h2>
          <Link to="/my-therapy-sessions" className="text-sm text-lavender-600 hover:text-lavender-800">
            View All →
          </Link>
        </div>

        {/* Next Upcoming Session */}
        {nextSession && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Next Session</span>
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                {nextSession.therapist?.user?.avatar_url ? (
                  <img 
                    src={nextSession.therapist.user.avatar_url} 
                    alt={nextSession.therapist.user.full_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full p-2 text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {nextSession.therapist?.user?.full_name}
                </div>
                <div className="text-sm text-gray-600">
                  {format(parseISO(nextSession.scheduled_start), 'MMM d, yyyy • h:mm a')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nextSession.status)}`}>
                {nextSession.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-gray-600 flex items-center">
                {nextSession.session_format === 'video' ? <Video className="w-3 h-3 mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
                {nextSession.session_format}
              </span>
            </div>
            
            <div className="flex space-x-2">
              {canJoinSession(nextSession) && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={nextSession.session_format === 'video' ? <Video size={14} /> : <Phone size={14} />}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Join Now
                </Button>
              )}
              <Link to={`/therapist-messages/${nextSession.therapist_id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MessageSquare size={14} />}
                >
                  Message
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Sessions</h3>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                    {session.therapist?.user?.avatar_url ? (
                      <img 
                        src={session.therapist.user.avatar_url} 
                        alt={session.therapist.user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-1 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {session.therapist?.user?.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(parseISO(session.scheduled_start), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Link to="/therapists">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={<Calendar size={16} />}
              >
                Book Session
              </Button>
            </Link>
            <Link to="/my-therapy-sessions">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={<Clock size={16} />}
              >
                View All
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TherapySessionCard;