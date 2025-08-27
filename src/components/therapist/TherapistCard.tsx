import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Video, 
  Phone, 
  User,
  Calendar,
  Shield,
  Award,
  CheckCircle,
  Brain,
  Heart,
  Users
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { TherapistProfile } from '../../types/therapist';

interface TherapistCardProps {
  therapist: TherapistProfile;
  onBook?: () => void;
}

const TherapistCard: React.FC<TherapistCardProps> = ({ therapist, onBook }) => {
  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(rate);
  };

  const getSpecializationIcon = (specialization: string) => {
    if (specialization.toLowerCase().includes('anxiety')) return <Brain className="w-3 h-3" />;
    if (specialization.toLowerCase().includes('depression')) return <Heart className="w-3 h-3" />;
    if (specialization.toLowerCase().includes('relationship') || specialization.toLowerCase().includes('couples')) return <Users className="w-3 h-3" />;
    return <Brain className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
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
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {therapist.user?.full_name}
                </h3>
                {therapist.verification_status === 'verified' ? (
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-yellow-600 font-medium">Pending Review</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{therapist.professional_title}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{therapist.years_experience} years</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{therapist.license_state}</span>
                </div>
                {therapist.average_rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{therapist.average_rating} ({therapist.total_reviews})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatRate(therapist.hourly_rate)}
              </div>
              <div className="text-xs text-gray-500">per hour</div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
            {therapist.bio}
          </p>

          {/* Specializations */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Specializations</h4>
            <div className="flex flex-wrap gap-2">
              {therapist.specializations?.slice(0, 3).map((spec) => (
                <span
                  key={spec.id}
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                >
                  {getSpecializationIcon(spec.specialization)}
                  <span>{spec.specialization}</span>
                </span>
              ))}
              {(therapist.specializations?.length || 0) > 3 && (
                <span className="text-xs text-gray-500">
                  +{(therapist.specializations?.length || 0) - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {therapist.accepts_insurance && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Insurance</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-blue-600">
                <Video className="w-4 h-4" />
                <span className="text-xs">Video</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-600">
                <Phone className="w-4 h-4" />
                <span className="text-xs">Phone</span>
              </div>
            </div>
          </div>

          {/* Session Types */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {therapist.session_types.map((type) => (
                <span
                  key={type}
                  className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs capitalize"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Link to={`/therapist/${therapist.id}`} className="flex-1">
              <Button
                variant="outline"
                fullWidth
                leftIcon={<User size={16} />}
              >
                View Profile
              </Button>
            </Link>
            <Link to={`/book-session/${therapist.id}`} className="flex-1">
              <Button
                variant="primary"
                fullWidth
                leftIcon={<Calendar size={16} />}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
                onClick={onBook}
              >
                Book Session
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TherapistCard;