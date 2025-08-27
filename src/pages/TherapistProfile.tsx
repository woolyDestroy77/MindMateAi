import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Star, 
  MapPin, 
  Award, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  CheckCircle,
  Video,
  Phone,
  MessageSquare,
  Shield,
  Clock,
  Users,
  Heart
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface TherapistProfile {
  id: string;
  professional_title: string;
  years_experience: number;
  bio: string;
  approach_description: string;
  hourly_rate: number;
  session_types: string[];
  languages_spoken: string[];
  accepts_insurance: boolean;
  insurance_networks: string[];
  license_state: string;
  education: any[];
  certifications: any[];
  user?: {
    full_name: string;
    avatar_url?: string;
  };
  average_rating?: number;
  total_reviews?: number;
  specializations?: any[];
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  would_recommend: boolean;
  created_at: string;
  client?: {
    full_name: string;
    avatar_url?: string;
  };
  is_anonymous: boolean;
}

const TherapistProfile: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (therapistId) {
      fetchTherapistProfile();
      fetchReviews();
    }
  }, [therapistId]);

  const fetchTherapistProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          user:users!therapist_profiles_user_id_fkey(
            full_name,
            avatar_url
          ),
          specializations:therapist_specializations(*)
        `)
        .eq('id', therapistId)
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('Therapist not found');
        navigate('/therapists');
        return;
      }

      // Calculate average rating
      const { data: reviewData } = await supabase
        .from('therapist_reviews')
        .select('rating')
        .eq('therapist_id', therapistId)
        .eq('is_approved', true);

      const average_rating = reviewData && reviewData.length > 0
        ? reviewData.reduce((sum, review) => sum + review.rating, 0) / reviewData.length
        : 0;

      setTherapist({
        ...data,
        average_rating: Math.round(average_rating * 10) / 10,
        total_reviews: reviewData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
      toast.error('Therapist not found');
      navigate('/therapists');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_reviews')
        .select(`
          *,
          client:users!therapist_reviews_client_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('therapist_id', therapistId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading therapist profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!therapist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/therapists')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Therapists
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <div className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {therapist.user?.avatar_url ? (
                      <img 
                        src={therapist.user.avatar_url} 
                        alt={therapist.user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {therapist.user?.full_name}
                      </h1>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Verified</span>
                      </div>
                    </div>
                    
                    <p className="text-xl text-gray-600 mb-4">{therapist.professional_title}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span>{therapist.years_experience} years</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{therapist.license_state}</span>
                      </div>
                      {therapist.average_rating && therapist.average_rating > 0 && (
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{therapist.average_rating} ({therapist.total_reviews})</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>${therapist.hourly_rate}/hour</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{therapist.bio}</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Therapeutic Approach</h3>
                <p className="text-gray-700 leading-relaxed">{therapist.approach_description}</p>
              </div>
            </Card>

            {/* Education & Certifications */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Credentials</h2>
                
                {therapist.education.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Education</h3>
                    <div className="space-y-3">
                      {therapist.education.map((edu: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="font-medium text-gray-900">
                            {edu.degree} in {edu.field_of_study}
                          </div>
                          <div className="text-sm text-gray-600">
                            {edu.institution} • {edu.year}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {therapist.certifications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Certifications</h3>
                    <div className="space-y-3">
                      {therapist.certifications.map((cert: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="font-medium text-gray-900">{cert.name}</div>
                          <div className="text-sm text-gray-600">
                            {cert.issuing_organization} • {format(parseISO(cert.issue_date), 'yyyy')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Reviews</h2>
                  
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                            {!review.is_anonymous && review.client?.avatar_url ? (
                              <img 
                                src={review.client.avatar_url} 
                                alt={review.client.full_name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-full h-full p-2 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {review.is_anonymous ? 'Anonymous' : review.client?.full_name}
                              </span>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {format(parseISO(review.created_at), 'MMM yyyy')}
                              </span>
                            </div>
                            
                            <p className="text-gray-700">{review.review_text}</p>
                            
                            {review.would_recommend && (
                              <div className="mt-2 text-sm text-green-600 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Would recommend
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ${therapist.hourly_rate}
                  </div>
                  <div className="text-sm text-gray-500">per hour</div>
                </div>
                
                <Link to={`/book-session/${therapist.id}`}>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Calendar size={18} />}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 mb-3"
                  >
                    Book Session
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<MessageSquare size={18} />}
                >
                  Send Message
                </Button>
              </div>
            </Card>

            {/* Session Info */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Session Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {therapist.session_types.map((type) => (
                        <span
                          key={type}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {therapist.languages_spoken.map((language) => (
                        <span
                          key={language}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Video className="w-4 h-4" />
                      <span className="text-xs">Video Sessions</span>
                    </div>
                    <div className="flex items-center space-x-1 text-purple-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs">Phone Sessions</span>
                    </div>
                  </div>
                  
                  {therapist.accepts_insurance && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Accepts Insurance</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Specializations */}
            {therapist.specializations && therapist.specializations.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Specializations</h3>
                  <div className="space-y-2">
                    {therapist.specializations.map((spec: any) => (
                      <div key={spec.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{spec.specialization}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          spec.experience_level === 'expert' ? 'bg-green-100 text-green-800' :
                          spec.experience_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {spec.experience_level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TherapistProfile;