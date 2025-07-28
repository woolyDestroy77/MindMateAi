import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  FileText,
  Video,
  MessageSquare,
  TrendingUp,
  Award,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { TherapistRegistrationForm } from './TherapistRegistration';

interface TherapistStats {
  totalSessions: number;
  upcomingSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  verificationStatus: string;
}

const TherapistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [therapistUser, setTherapistUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stats, setStats] = useState<TherapistStats>({
    totalSessions: 0,
    upcomingSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    verificationStatus: 'pending'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [therapistProfile, setTherapistProfile] = useState<any>(null);

  useEffect(() => {
    const checkTherapistAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
          const userType = user.user_metadata?.user_type;
          const isTherapist = user.user_metadata?.is_therapist;
          
          if (userType === 'therapist' || isTherapist) {
            setTherapistUser(user);
          } else {
            // Not a therapist account, redirect
            navigate('/become-therapist');
            return;
          }
        } else {
          // Not signed in, redirect
          navigate('/become-therapist');
          return;
        }
      } catch (error) {
        console.error('Error checking therapist auth:', error);
        navigate('/become-therapist');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkTherapistAuth();
  }, [navigate]);

  useEffect(() => {
    if (therapistUser) {
      fetchTherapistData();
    }
  }, [therapistUser]);

  const fetchTherapistData = async () => {
    try {
      setIsLoading(true);

      // Get therapist profile
      const { data: profile, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', therapistUser?.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - redirect to registration
          toast.error('Please complete your therapist registration first');
          return;
        }
        throw profileError;
      }

      setTherapistProfile(profile);

      // Get session stats
      const { data: sessions, error: sessionsError } = await supabase
        .from('therapy_sessions')
        .select('*')
        .eq('therapist_id', profile.id);

      if (sessionsError) throw sessionsError;

      // Get reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('therapist_reviews')
        .select('rating')
        .eq('therapist_id', profile.id)
        .eq('is_approved', true);

      if (reviewsError) throw reviewsError;

      // Calculate stats
      const totalSessions = sessions?.length || 0;
      const upcomingSessions = sessions?.filter(s => 
        s.status === 'scheduled' && new Date(s.scheduled_start) > new Date()
      ).length || 0;
      
      const totalEarnings = sessions?.reduce((sum, s) => 
        s.status === 'completed' ? sum + s.total_cost : sum, 0
      ) || 0;

      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        totalSessions,
        upcomingSessions,
        totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews?.length || 0,
        verificationStatus: profile.verification_status
      });

    } catch (error) {
      console.error('Error fetching therapist data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      case 'suspended': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking therapist authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your therapist dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!therapistProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Embedded Registration Form */}
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-blue-900">Complete Your Therapist Registration</h1>
                  </div>
                  <p className="text-blue-700">
                    Welcome! Please complete your professional profile to start accepting clients.
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Import and render the registration form */}
            <TherapistRegistrationForm 
              isEmbedded={true}
              onComplete={() => {
                toast.success('Registration completed! Refreshing dashboard...');
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }}
            />
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
              <h1 className="text-3xl font-bold text-gray-900">Therapist Dashboard</h1>
              <p className="text-gray-600">Welcome back, {therapistProfile.professional_title}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getVerificationStatusColor(stats.verificationStatus)}`}>
                {getVerificationIcon(stats.verificationStatus)}
                <span className="capitalize">{stats.verificationStatus}</span>
              </div>
              <Button
                variant="outline"
                leftIcon={<Settings size={16} />}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Verification Status Alert */}
        {stats.verificationStatus !== 'verified' && (
          <Card className="mb-8 bg-yellow-50 border-yellow-200">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">
                    {stats.verificationStatus === 'pending' && 'Verification Pending'}
                    {stats.verificationStatus === 'rejected' && 'Verification Rejected'}
                    {stats.verificationStatus === 'suspended' && 'Account Suspended'}
                  </h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    {stats.verificationStatus === 'pending' && 'Your application is being reviewed. You\'ll receive an email within 3-5 business days.'}
                    {stats.verificationStatus === 'rejected' && 'Your application was rejected. Please contact support for more information.'}
                    {stats.verificationStatus === 'suspended' && 'Your account has been suspended. Please contact support immediately.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                    <p className="text-xs text-gray-500">{stats.totalReviews} reviews</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Calendar size={16} />}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Manage Schedule
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Users size={16} />}
                  >
                    View Clients
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<FileText size={16} />}
                  >
                    Session Notes
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<DollarSign size={16} />}
                  >
                    Earnings Report
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Settings size={16} />}
                  >
                    Profile Settings
                  </Button>
                </div>
              </div>
            </Card>

            {/* Profile Summary */}
            <Card className="mt-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hourly Rate:</span>
                    <span className="font-medium">${therapistProfile.hourly_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{therapistProfile.years_experience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License State:</span>
                    <span className="font-medium">{therapistProfile.license_state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Types:</span>
                    <span className="font-medium">{therapistProfile.session_types.length}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                
                {stats.verificationStatus === 'verified' ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-600 mb-4">
                      You don't have any recent sessions or bookings yet.
                    </p>
                    <Button
                      variant="primary"
                      leftIcon={<Settings size={16} />}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      Set Up Your Availability
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Required</h3>
                    <p className="text-gray-600">
                      Complete your verification to start accepting clients and managing sessions.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Getting Started Guide */}
            <Card className="mt-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      stats.verificationStatus === 'verified' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {stats.verificationStatus === 'verified' ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <span className="text-sm text-gray-700">Complete verification process</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <Calendar size={16} />
                    </div>
                    <span className="text-sm text-gray-700">Set up your availability schedule</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <span className="text-sm text-gray-700">Start accepting client bookings</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <Video size={16} />
                    </div>
                    <span className="text-sm text-gray-700">Conduct your first therapy session</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TherapistDashboard;