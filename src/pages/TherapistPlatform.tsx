import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
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
  Heart,
  Brain,
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useTherapistPlatform } from '../hooks/useTherapistPlatform';
import { TherapistSearchFilters, TherapistProfile } from '../types/therapist';

const TherapistPlatform: React.FC = () => {
  const { 
    therapists, 
    isLoading, 
    searchTherapists 
  } = useTherapistPlatform();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TherapistSearchFilters>({});

  const specializations = [
    'Anxiety Disorders',
    'Depression',
    'Trauma & PTSD',
    'Addiction Recovery',
    'Relationship Issues',
    'Family Therapy',
    'Grief & Loss',
    'Eating Disorders',
    'ADHD',
    'Bipolar Disorder',
    'OCD',
    'Stress Management'
  ];

  const sessionTypes = [
    { value: 'individual', label: 'Individual Therapy' },
    { value: 'couples', label: 'Couples Therapy' },
    { value: 'family', label: 'Family Therapy' },
    { value: 'group', label: 'Group Therapy' }
  ];

  const handleSearch = () => {
    const searchFilters: TherapistSearchFilters = {
      ...filters
    };
    searchTherapists(searchFilters);
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(rate);
  };

  const getSpecializationIcon = (specialization: string) => {
    if (specialization.toLowerCase().includes('anxiety')) return <Brain className="w-4 h-4" />;
    if (specialization.toLowerCase().includes('depression')) return <Heart className="w-4 h-4" />;
    if (specialization.toLowerCase().includes('trauma')) return <Shield className="w-4 h-4" />;
    if (specialization.toLowerCase().includes('addiction')) return <Award className="w-4 h-4" />;
    if (specialization.toLowerCase().includes('relationship') || specialization.toLowerCase().includes('couples')) return <Users className="w-4 h-4" />;
    return <Brain className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Therapist
            </h1>
          </motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with licensed, verified therapists for professional mental health support. 
            All sessions are HIPAA-compliant and secure.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, specialization, or approach..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<Filter size={18} />}
                >
                  Filters
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  isLoading={isLoading}
                  leftIcon={<Search size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Specializations */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specializations
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {specializations.map((spec) => (
                          <label key={spec} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.specializations?.includes(spec) || false}
                              onChange={(e) => {
                                const current = filters.specializations || [];
                                if (e.target.checked) {
                                  setFilters({
                                    ...filters,
                                    specializations: [...current, spec]
                                  });
                                } else {
                                  setFilters({
                                    ...filters,
                                    specializations: current.filter(s => s !== spec)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Session Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Types
                      </label>
                      <div className="space-y-2">
                        {sessionTypes.map((type) => (
                          <label key={type.value} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.session_types?.includes(type.value as any) || false}
                              onChange={(e) => {
                                const current = filters.session_types || [];
                                if (e.target.checked) {
                                  setFilters({
                                    ...filters,
                                    session_types: [...current, type.value as any]
                                  });
                                } else {
                                  setFilters({
                                    ...filters,
                                    session_types: current.filter(s => s !== type.value)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate Range
                      </label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600">Minimum</label>
                          <input
                            type="number"
                            placeholder="$50"
                            value={filters.min_rate || ''}
                            onChange={(e) => setFilters({
                              ...filters,
                              min_rate: e.target.value ? Number(e.target.value) : undefined
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Maximum</label>
                          <input
                            type="number"
                            placeholder="$200"
                            value={filters.max_rate || ''}
                            onChange={(e) => setFilters({
                              ...filters,
                              max_rate: e.target.value ? Number(e.target.value) : undefined
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({});
                        setShowFilters(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleSearch();
                        setShowFilters(false);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Finding therapists for you...</p>
          </div>
        ) : therapists.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No therapists found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters to find more therapists.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setFilters({});
                searchTherapists();
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Show All Therapists
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {therapists.map((therapist) => (
              <motion.div
                key={therapist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
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
                          <div className="flex items-center space-x-1">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
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
                              <Star className="w-4 h-4 text-yellow-500" />
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
                        {therapist.specializations?.slice(0, 4).map((spec) => (
                          <span
                            key={spec.id}
                            className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                          >
                            {getSpecializationIcon(spec.specialization)}
                            <span>{spec.specialization}</span>
                          </span>
                        ))}
                        {(therapist.specializations?.length || 0) > 4 && (
                          <span className="text-xs text-gray-500">
                            +{(therapist.specializations?.length || 0) - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Session Types & Languages */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Session Types</h4>
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
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Languages</h4>
                        <div className="flex flex-wrap gap-1">
                          {therapist.languages_spoken.slice(0, 2).map((lang) => (
                            <span
                              key={lang}
                              className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                            >
                              {lang}
                            </span>
                          ))}
                          {therapist.languages_spoken.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{therapist.languages_spoken.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Insurance & Availability */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {therapist.accepts_insurance && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Accepts Insurance</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Video className="w-4 h-4" />
                          <span className="text-xs">Video Sessions</span>
                        </div>
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
                        >
                          Book Session
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Crisis Support Banner */}
        <Card className="mt-8 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Crisis Support Available</h3>
            </div>
            <p className="text-red-800 mb-4">
              If you're experiencing a mental health crisis or having thoughts of self-harm, 
              please reach out for immediate help.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="tel:988"
                className="flex items-center space-x-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">Crisis Lifeline</div>
                  <div className="text-sm text-red-700">Call 988</div>
                </div>
              </a>
              
              <a
                href="sms:741741?body=HOME"
                className="flex items-center space-x-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">Crisis Text</div>
                  <div className="text-sm text-red-700">Text HOME to 741741</div>
                </div>
              </a>
              
              <Link
                to="/chat"
                className="flex items-center space-x-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Brain className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">AI Support</div>
                  <div className="text-sm text-red-700">24/7 Available</div>
                </div>
              </Link>
            </div>
          </div>
        </Card>

        {/* Therapist CTA */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="p-6 text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Are you a licensed therapist?</h3>
            <p className="text-blue-800 mb-6">
              Join our platform and help clients on their mental health journey. 
              Set your own rates, manage your schedule, and make a difference.
            </p>
            <Link to="/become-therapist">
              <Button
                variant="primary"
                leftIcon={<Shield size={18} />}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Become a Therapist
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default TherapistPlatform;