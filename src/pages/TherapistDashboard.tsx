import React, { useState, useEffect, useCallback } from 'react';
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
import { TherapistRegistrationForm } from '../components/therapist/TherapistRegistrationForm';

interface TherapistStats {
  totalSessions: number;
  upcomingSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  verificationStatus: string;
}

const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
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
    if (user) {
      fetchTherapistData();
    }
  }, [user]);

  const fetchTherapistData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 FETCHING FRESH THERAPIST DATA - ENHANCED DEBUG...');
      console.log('👨‍⚕️ Therapist user ID:', user?.id);
      console.log('📧 Therapist email:', user?.email);
      
      // Clear any cached data first
      setTherapistProfile(null);
      setStats({
        totalSessions: 0,
        upcomingSessions: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        verificationStatus: 'pending'
      });
      
      // STEP 1: Check user profile first for account status
      console.log('🔍 STEP 1: Checking user profile and account status...');
      
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
        
      if (userProfileError) {
        console.error('❌ USER PROFILE ERROR:', userProfileError);
        // Create user profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user?.id,
            user_type: 'therapist',
            account_status: 'pending',
            full_name: user?.user_metadata?.full_name || '',
            email: user?.email || ''
          }])
          .select()
          .single();
          
        if (createError) throw createError;
        console.log('✅ CREATED NEW USER PROFILE:', newProfile);
      } else {
        console.log('✅ USER PROFILE FOUND:', {
          user_type: userProfile.user_type,
          account_status: userProfile.account_status,
          full_name: userProfile.full_name
        });
      }
      
      // STEP 2: Get therapist profile with real-time query
      console.log('🔍 STEP 1: Fetching therapist profile...');
      
      const { data: profile, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('❌ THERAPIST PROFILE ERROR:', profileError);
        if (profileError.code === 'PGRST116') {
          console.log('📝 No therapist profile found - showing registration form');
          setTherapistProfile(null);
          return;
        }
        throw profileError;
      }
      
      console.log('✅ THERAPIST PROFILE FOUND:', {
        id: profile.id,
        verification_status: profile.verification_status,
        is_active: profile.is_active,
        professional_title: profile.professional_title,
        hourly_rate: profile.hourly_rate,
        updated_at: profile.updated_at
      });

      setTherapistProfile(profile);
      
      // STEP 3: Update stats with real verification status
      console.log('📊 STEP 2: Updating verification status to:', profile.verification_status);
      
      setStats(prevStats => ({
        ...prevStats,
        verificationStatus: profile.verification_status
      }));

      // STEP 4: Get session stats with enhanced debugging
      console.log('📋 STEP 3: Fetching sessions for therapist profile ID:', profile.id);
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          client:users!therapy_sessions_client_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('therapist_id', profile.id);

      if (sessionsError) {
        console.error('❌ SESSIONS FETCH ERROR:', sessionsError);
        throw sessionsError;
      }
      
      console.log('📅 SESSIONS FOUND FOR THERAPIST:', sessions?.length || 0);
      console.log('📋 SESSION BREAKDOWN:', sessions?.map(s => ({
        id: s.id,
        client: s.client?.full_name,
        status: s.status,
        date: s.scheduled_start
      })));

      // STEP 5: Get reviews
      console.log('⭐ STEP 4: Fetching reviews...');
      
      const { data: reviews, error: reviewsError } = await supabase
        .from('therapist_reviews')
        .select('rating')
        .eq('therapist_id', profile.id)
        .eq('is_approved', true);

      if (reviewsError) {
        console.error('❌ REVIEWS FETCH ERROR:', reviewsError);
        throw reviewsError;
      }
      
      console.log('⭐ REVIEWS FOUND:', reviews?.length || 0);

      // STEP 6: Calculate final stats
      console.log('🧮 STEP 5: Calculating final stats...');
      
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

      const finalStats = {
        totalSessions,
        upcomingSessions,
        totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews?.length || 0,
        verificationStatus: profile.verification_status
      };
      
      console.log('📊 FINAL CALCULATED STATS:', finalStats);
      setStats(finalStats);

      console.log('✅ THERAPIST DATA FETCH COMPLETE');

    } catch (error) {
      console.error('❌ CRITICAL ERROR FETCHING THERAPIST DATA:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a refresh function that can be called manually
  const refreshDashboard = useCallback(async () => {
    if (user) {
      console.log('🔄 MANUAL REFRESH TRIGGERED...');
      
      // Clear all cached data
      setTherapistProfile(null);
      setStats({
        totalSessions: 0,
        upcomingSessions: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        verificationStatus: 'pending'
      });
      
      await fetchTherapistData();
      
      toast.success('Dashboard refreshed! Check verification status.');
      
      // Force page reload after 1 second to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [user, fetchTherapistData]);

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
          <div className="mb-8 bg-yellow-50 border-yellow-200 rounded-xl transition-all duration-300 overflow-hidden bg-white p-5">
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
                    {stats.verificationStatus === 'pending' && 'Your application is being reviewed by our admin team. You\'ll be notified as soon as it\'s approved.'}
                    {stats.verificationStatus === 'rejected' && 'Your application was rejected. Please contact support for more information.'}
                    {stats.verificationStatus === 'suspended' && 'Your account has been suspended. Please contact support immediately.'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={refreshDashboard}
                  leftIcon={<TrendingUp size={16} />}
                  className="mr-3"
                >
                  Force Refresh Status
                </Button>
                <span className="text-xs text-yellow-700">
                  Status not updated? Click to force refresh from database.
                </span>
              </div>
            </div>
          </div>
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
                   <Link to="/therapist-messages">
                     <Button
                       variant="outline"
                       fullWidth
                       leftIcon={<MessageSquare size={16} />}
                     >
                       Client Messages
                     </Button>
                   </Link>
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