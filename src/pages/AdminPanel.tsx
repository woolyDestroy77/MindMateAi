import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle, 
  User, 
  Award,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Settings
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PendingTherapist {
  id: string;
  user_id: string;
  license_number: string;
  license_state: string;
  license_expiry: string;
  verification_status: string;
  professional_title: string;
  years_experience: number;
  education: any[];
  certifications: any[];
  bio: string;
  hourly_rate: number;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingTherapists, setPendingTherapists] = useState<PendingTherapist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState<PendingTherapist | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is authorized admin
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user && user.email === 'youssef.arafat09@gmail.com') {
          setIsAuthorized(true);
          
          console.log('✅ Admin user authenticated:', user.id);
          console.log('📧 Admin email:', user.email);
          
          // Store admin user ID for notifications (CRITICAL)
          localStorage.setItem('admin_user_id', user.id);
          console.log('💾 Stored admin user ID in localStorage:', user.id);
        } else {
          // Not authorized, redirect to dashboard
          toast.error('Access denied. Admin privileges required.');
          navigate('/dashboard');
          return;
        }
        
        // Also create admin_users entry if it doesn't exist
        const { error: adminError } = await supabase
          .from('admin_users')
          .upsert([{
            user_id: user.id,
            email: user.email,
            role: 'admin',
            last_login: new Date().toISOString()
          }], {
            onConflict: 'user_id'
          });
          
        if (adminError) {
          console.error('Error creating admin user entry:', adminError);
        } else {
          console.log('✅ Admin user entry created/updated');
        }
      } catch (error) {
        console.error('Error checking admin auth:', error);
        navigate('/dashboard');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAuthorized) {
      fetchPendingTherapists();
    }
  }, [isAuthorized]);

  const fetchPendingTherapists = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching ALL therapist profiles...');
      
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          user:users(
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📋 ALL therapist profiles found:', data?.length || 0);
      console.log('🔍 Pending applications:', data?.filter(t => t.verification_status === 'pending').length || 0);
      console.log('✅ Verified applications:', data?.filter(t => t.verification_status === 'verified').length || 0);
      console.log('❌ Rejected applications:', data?.filter(t => t.verification_status === 'rejected').length || 0);
      
      // Log each profile for debugging
      data?.forEach((profile, index) => {
        console.log(`Profile ${index + 1}:`, {
          id: profile.id,
          name: profile.user?.full_name,
          email: profile.user?.email,
          status: profile.verification_status,
          created: profile.created_at
        });
      });
      
      setPendingTherapists(data || []);
    } catch (error) {
      console.error('Error fetching pending therapists:', error);
      toast.error('Failed to load pending therapists');
    } finally {
      setIsLoading(false);
    }
  };

  const approveTherapist = async (therapistId: string) => {
    try {
      console.log('🔄 Approving therapist:', therapistId);
      
      // STEP 1: Update therapist profile with ALL required fields
      const { data: updatedTherapist, error } = await supabase
        .from('therapist_profiles')
        .update({ 
          verification_status: 'verified',
          is_active: true,
          hipaa_training_completed: true,
          hipaa_training_date: new Date().toISOString().split('T')[0],
          background_check_completed: true,
          background_check_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId)
        .select('*')
        .single();

      if (error) throw error;

      console.log('✅ Therapist approved and activated:', updatedTherapist);
      
      // STEP 2: Force verify the therapist is now searchable
      console.log('🔍 VERIFYING THERAPIST IS NOW SEARCHABLE...');
      
      const { data: searchTest, error: searchError } = await supabase
        .from('therapist_profiles')
        .select(`
          id,
          verification_status,
          is_active,
          professional_title,
          user:users!therapist_profiles_user_id_fkey(full_name)
        `)
        .eq('verification_status', 'verified')
        .eq('is_active', true);
        
      if (searchError) {
        console.error('❌ Search test failed:', searchError);
      } else {
        console.log('🔍 SEARCH TEST RESULTS:', searchTest?.length || 0, 'verified therapists found');
        searchTest?.forEach((t, i) => {
          console.log(`Therapist ${i + 1}:`, {
            id: t.id,
            name: t.user?.full_name,
            status: t.verification_status,
            active: t.is_active,
            title: t.professional_title
          });
        });
        
        const isTherapistInSearch = searchTest?.find(t => t.id === therapistId);
        if (isTherapistInSearch) {
          console.log('✅ THERAPIST IS NOW SEARCHABLE!');
        } else {
          console.log('❌ THERAPIST STILL NOT SEARCHABLE - INVESTIGATING...');
        }
      }
      
      // Get therapist details for notification
      const therapist = pendingTherapists.find(t => t.id === therapistId);
      
      // Send approval notification to the therapist
      if (therapist?.user_id) {
        try {
          const { error: notificationError } = await supabase
            .from('user_notifications')
            .insert([{
              user_id: therapist.user_id,
              title: 'Therapist Application Approved! 🎉',
              message: 'Congratulations! Your therapist application has been approved and your profile is now LIVE. Clients can find and book sessions with you immediately.',
              type: 'achievement',
              priority: 'high',
              read: false,
              action_url: '/therapist-dashboard',
              action_text: 'Go to Dashboard',
              metadata: {
                approval_date: new Date().toISOString(),
                approved_by: user?.id
              }
            }]);
            
          if (notificationError) {
            console.error('Failed to send approval notification:', notificationError);
          } else {
            console.log('✅ Approval notification sent to therapist');
          }
        } catch (notifError) {
          console.error('Error sending approval notification:', notifError);
        }
      }
      
      toast.success('Therapist approved successfully!');
      fetchPendingTherapists();
    } catch (error) {
      console.error('Error approving therapist:', error);
      toast.error('Failed to approve therapist');
    }
  };

  const rejectTherapist = async (therapistId: string) => {
    try {
      console.log('🔄 Rejecting therapist:', therapistId);
      
      const { error } = await supabase
        .from('therapist_profiles')
        .update({ 
          verification_status: 'rejected',
          is_active: false, // Disable therapist from being discoverable
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId);

      if (error) throw error;

      console.log('✅ Therapist rejected successfully');
      
      // Get therapist details for notification
      const therapist = pendingTherapists.find(t => t.id === therapistId);
      
      // Send rejection notification to the therapist
      if (therapist?.user_id) {
        try {
          const { error: notificationError } = await supabase
            .from('user_notifications')
            .insert([{
              user_id: therapist.user_id,
              title: 'Application Update',
              message: 'Your therapist application requires additional review. Please contact support for more information.',
              type: 'alert',
              priority: 'high',
              read: false,
              action_url: '/become-therapist',
              action_text: 'Contact Support',
              metadata: {
                rejection_date: new Date().toISOString(),
                rejected_by: user?.id
              }
            }]);
            
          if (notificationError) {
            console.error('Failed to send rejection notification:', notificationError);
          } else {
            console.log('✅ Rejection notification sent to therapist');
          }
        } catch (notifError) {
          console.error('Error sending rejection notification:', notifError);
        }
      }
      
      toast.success('Therapist application rejected');
      fetchPendingTherapists();
    } catch (error) {
      console.error('Error rejecting therapist:', error);
      toast.error('Failed to reject therapist');
    }
  };

  const autoApproveAll = async () => {
    try {
      const pendingIds = pendingTherapists
        .filter(t => t.verification_status === 'pending')
        .map(t => t.id);

      if (pendingIds.length === 0) {
        toast.error('No pending applications to approve');
        return;
      }

      const { error } = await supabase
        .from('therapist_profiles')
        .update({ 
          verification_status: 'verified',
          hipaa_training_completed: true,
          hipaa_training_date: new Date().toISOString().split('T')[0],
          background_check_completed: true,
          background_check_date: new Date().toISOString().split('T')[0]
        })
        .in('id', pendingIds);

      if (error) throw error;

      toast.success(`Auto-approved ${pendingIds.length} therapist applications!`);
      fetchPendingTherapists();
    } catch (error) {
      console.error('Error auto-approving therapists:', error);
      toast.error('Failed to auto-approve therapists');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'verified': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking admin authorization...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin panel...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-600" />
                Therapist Admin Panel
              </h1>
              <p className="text-gray-600">Review and approve therapist applications</p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={autoApproveAll}
                leftIcon={<CheckCircle size={16} />}
                className="bg-green-600 hover:bg-green-700"
              >
                Auto-Approve All Pending
              </Button>
              <Button
                variant="outline"
                onClick={fetchPendingTherapists}
                leftIcon={<Settings size={16} />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingTherapists.filter(t => t.verification_status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected Applications</p>
                  <p className="text-2xl font-bold text-red-600">
                    {pendingTherapists.filter(t => t.verification_status === 'rejected').length}
                  </p>
                </div>
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingTherapists.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Applications List */}
        {pendingTherapists.length === 0 ? (
          <Card className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
            <p className="text-gray-600 mb-4">No therapist applications found in the database.</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Debug: Check browser console for detailed logs</p>
              <p>If applications exist but don't appear, there may be a database query issue</p>
            </div>
            <Button
              variant="outline"
              onClick={fetchPendingTherapists}
              className="mt-4"
            >
              Refresh & Debug
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All Therapist Applications</h2>
              {pendingTherapists.map((therapist) => (
              <motion.div
                key={therapist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                          {therapist.user?.avatar_url ? (
                            <img 
                              src={therapist.user.avatar_url} 
                              alt={therapist.user.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-3 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {therapist.user?.full_name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(therapist.verification_status)}`}>
                              {getStatusIcon(therapist.verification_status)}
                              <span className="capitalize">{therapist.verification_status}</span>
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-2">{therapist.professional_title}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{therapist.user?.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4 text-gray-400" />
                              <span>{therapist.years_experience} years exp.</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{therapist.license_state}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span>${therapist.hourly_rate}/hour</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-700 line-clamp-2">{therapist.bio}</p>
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-500">
                            Applied: {format(new Date(therapist.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTherapist(therapist)}
                          leftIcon={<Eye size={16} />}
                        >
                          Review
                        </Button>
                        
                        {therapist.verification_status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => approveTherapist(therapist.id)}
                              leftIcon={<CheckCircle size={16} />}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectTherapist(therapist.id)}
                              leftIcon={<X size={16} />}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {therapist.verification_status === 'rejected' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => approveTherapist(therapist.id)}
                            leftIcon={<CheckCircle size={16} />}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve & Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            </div>
          </div>
        )}

        {/* Detailed Review Modal */}
        {selectedTherapist && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Review Application: {selectedTherapist.user?.full_name}
                  </h2>
                  <button
                    onClick={() => setSelectedTherapist(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* License Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">License Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">License Number</label>
                      <p className="text-gray-900">{selectedTherapist.license_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">License State</label>
                      <p className="text-gray-900">{selectedTherapist.license_state}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">License Expiry</label>
                      <p className="text-gray-900">{format(new Date(selectedTherapist.license_expiry), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Years Experience</label>
                      <p className="text-gray-900">{selectedTherapist.years_experience} years</p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Education</h3>
                  <div className="space-y-3">
                    {selectedTherapist.education.map((edu: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                  <div className="space-y-3">
                    {selectedTherapist.certifications.map((cert: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">{cert.name}</h4>
                        <p className="text-gray-600">{cert.issuer}</p>
                        <p className="text-sm text-gray-500">{cert.year}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Bio</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTherapist.bio}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTherapist(null)}
                  >
                    Close
                  </Button>
                  {selectedTherapist.verification_status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          rejectTherapist(selectedTherapist.id);
                          setSelectedTherapist(null);
                        }}
                        leftIcon={<X size={16} />}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          approveTherapist(selectedTherapist.id);
                          setSelectedTherapist(null);
                        }}
                        leftIcon={<CheckCircle size={16} />}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;