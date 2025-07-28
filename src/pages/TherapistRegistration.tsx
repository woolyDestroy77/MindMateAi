import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Award, 
  FileText, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Brain,
  Heart,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Info,
  LogIn,
  UserPlus
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import TherapistAuthModal from '../components/auth/TherapistAuthModal';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface RegistrationData {
  // Personal Info
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  professionalTitle: string;
  yearsExperience: number;
  
  // Education & Certifications
  education: Array<{
    degree: string;
    institution: string;
    year: number;
    fieldOfStudy: string;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
  
  // Professional Info
  bio: string;
  approachDescription: string;
  languagesSpoken: string[];
  hourlyRate: number;
  sessionTypes: string[];
  acceptsInsurance: boolean;
  insuranceNetworks: string[];
  timezone: string;
  
  // Specializations
  specializations: Array<{
    specialization: string;
    category: string;
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
  }>;
  
  // Compliance
  hipaaTrainingCompleted: boolean;
  hipaaTrainingDate?: string;
  backgroundCheckCompleted: boolean;
  backgroundCheckDate?: string;
}

interface TherapistRegistrationProps {
  isEmbedded?: boolean;
  onComplete?: () => void;
}

export const TherapistRegistrationForm: React.FC<TherapistRegistrationProps> = ({ 
  isEmbedded = false, 
  onComplete 
}) => {
  const navigate = useNavigate();
  const [therapistUser, setTherapistUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is signed in as therapist
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
          }
        }
      } catch (error) {
        console.error('Error checking therapist auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkTherapistAuth();
  }, []);

  const handleAuthSuccess = () => {
    // Refresh the page to check auth status
    window.location.reload();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  // If not signed in as therapist, show auth options
  if (!therapistUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-12">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Therapist Portal Access Required
              </h1>
              <p className="text-gray-600 mb-8">
                To become a therapist on our platform, you need a dedicated therapist account. 
                This is separate from patient accounts to maintain professional boundaries and compliance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowAuthModal('signup')}
                  leftIcon={<UserPlus size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Create Therapist Account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAuthModal('signin')}
                  leftIcon={<LogIn size={18} />}
                >
                  Sign In as Therapist
                </Button>
              </div>
              
              <div className="mt-8 text-sm text-gray-500">
                <p>Already have a patient account? <a href="/" className="text-blue-600 hover:text-blue-700">Go to patient portal</a></p>
              </div>
            </Card>
          </div>
        </main>
        
        {/* Therapist Auth Modal */}
        {showAuthModal && (
          <TherapistAuthModal
            mode={showAuthModal}
            onClose={() => setShowAuthModal(null)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    );
  }

  // Rest of the existing registration component for authenticated therapists
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    licenseNumber: '',
    licenseState: '',
    licenseExpiry: '',
    professionalTitle: '',
    yearsExperience: 0,
    education: [{ degree: '', institution: '', year: new Date().getFullYear(), fieldOfStudy: '' }],
    certifications: [],
    bio: '',
    approachDescription: '',
    languagesSpoken: ['English'],
    hourlyRate: 100,
    sessionTypes: ['individual'],
    acceptsInsurance: false,
    insuranceNetworks: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    specializations: [],
    hipaaTrainingCompleted: false,
    backgroundCheckCompleted: false
  });

  const steps = [
    { id: 1, title: 'License & Credentials', icon: Shield },
    { id: 2, title: 'Education & Experience', icon: Award },
    { id: 3, title: 'Professional Profile', icon: User },
    { id: 4, title: 'Services & Pricing', icon: DollarSign },
    { id: 5, title: 'Compliance & Verification', icon: CheckCircle }
  ];

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const professionalTitles = [
    'Licensed Clinical Social Worker (LCSW)',
    'Licensed Professional Counselor (LPC)',
    'Licensed Marriage and Family Therapist (LMFT)',
    'Licensed Mental Health Counselor (LMHC)',
    'Psychologist (PhD/PsyD)',
    'Psychiatrist (MD)',
    'Licensed Clinical Mental Health Counselor (LCMHC)',
    'Licensed Professional Clinical Counselor (LPCC)',
    'Licensed Clinical Professional Counselor (LCPC)',
    'Other'
  ];

  const specializations = [
    { name: 'Anxiety Disorders', category: 'Mental Health' },
    { name: 'Depression', category: 'Mental Health' },
    { name: 'Trauma & PTSD', category: 'Trauma' },
    { name: 'Addiction Recovery', category: 'Addiction' },
    { name: 'Relationship Issues', category: 'Relationships' },
    { name: 'Family Therapy', category: 'Family' },
    { name: 'Grief & Loss', category: 'Life Transitions' },
    { name: 'Eating Disorders', category: 'Behavioral Health' },
    { name: 'ADHD', category: 'Neurodevelopmental' },
    { name: 'Bipolar Disorder', category: 'Mental Health' },
    { name: 'OCD', category: 'Mental Health' },
    { name: 'Stress Management', category: 'Wellness' },
    { name: 'Teen & Adolescent Therapy', category: 'Age-Specific' },
    { name: 'LGBTQ+ Issues', category: 'Identity' },
    { name: 'Career Counseling', category: 'Life Transitions' }
  ];

  const sessionTypes = [
    { value: 'individual', label: 'Individual Therapy' },
    { value: 'couples', label: 'Couples Therapy' },
    { value: 'family', label: 'Family Therapy' },
    { value: 'group', label: 'Group Therapy' }
  ];

  const insuranceNetworks = [
    'Aetna', 'Anthem', 'Blue Cross Blue Shield', 'Cigna', 'Humana', 'Kaiser Permanente',
    'Medicaid', 'Medicare', 'UnitedHealthcare', 'Tricare', 'Other'
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addEducation = () => {
    setRegistrationData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: new Date().getFullYear(), fieldOfStudy: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    setRegistrationData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addCertification = () => {
    setRegistrationData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { 
        name: '', 
        issuingOrganization: '', 
        issueDate: '',
        expiryDate: '',
        credentialId: ''
      }]
    }));
  };

  const removeCertification = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index: number, field: string, value: any) => {
    setRegistrationData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const addSpecialization = (spec: { name: string; category: string }) => {
    if (!registrationData.specializations.find(s => s.specialization === spec.name)) {
      setRegistrationData(prev => ({
        ...prev,
        specializations: [...prev.specializations, {
          specialization: spec.name,
          category: spec.category,
          experienceLevel: 'intermediate'
        }]
      }));
    }
  };

  const removeSpecialization = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const updateSpecializationLevel = (index: number, level: 'beginner' | 'intermediate' | 'expert') => {
    setRegistrationData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) => 
        i === index ? { ...spec, experienceLevel: level } : spec
      )
    }));
  };

  const handleSubmit = async () => {
    if (!therapistUser) {
      toast.error('You must be logged in to register as a therapist');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create therapist profile
      const { data: therapistProfile, error: profileError } = await supabase
        .from('therapist_profiles')
        .insert([{
          user_id: therapistUser.id,
          license_number: registrationData.licenseNumber,
          license_state: registrationData.licenseState,
          license_expiry: registrationData.licenseExpiry,
          professional_title: registrationData.professionalTitle,
          years_experience: registrationData.yearsExperience,
          education: registrationData.education,
          certifications: registrationData.certifications,
          bio: registrationData.bio,
          approach_description: registrationData.approachDescription,
          languages_spoken: registrationData.languagesSpoken,
          hourly_rate: registrationData.hourlyRate,
          session_types: registrationData.sessionTypes,
          accepts_insurance: registrationData.acceptsInsurance,
          insurance_networks: registrationData.insuranceNetworks,
          timezone: registrationData.timezone,
          hipaa_training_completed: registrationData.hipaaTrainingCompleted,
          hipaa_training_date: registrationData.hipaaTrainingDate,
          background_check_completed: registrationData.backgroundCheckCompleted,
          background_check_date: registrationData.backgroundCheckDate,
          verification_status: 'pending'
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Add specializations
      if (registrationData.specializations.length > 0) {
        const specializationsData = registrationData.specializations.map(spec => ({
          therapist_id: therapistProfile.id,
          specialization: spec.specialization,
          category: spec.category,
          experience_level: spec.experienceLevel
        }));

        const { error: specError } = await supabase
          .from('therapist_specializations')
          .insert(specializationsData);

        if (specError) throw specError;
      }

      // Auto-approve for testing (remove in production)
      setTimeout(async () => {
        try {
          const { error: autoApproveError } = await supabase
            .from('therapist_profiles')
            .update({ 
              verification_status: 'verified',
              hipaa_training_completed: true,
              hipaa_training_date: new Date().toISOString().split('T')[0],
              background_check_completed: true,
              background_check_date: new Date().toISOString().split('T')[0]
            })
            .eq('user_id', therapistUser.id);

          if (!autoApproveError) {
            toast.success('🚀 Auto-approved for testing! You can now access your therapist dashboard.');
          }
      if (onComplete) {
        onComplete();
      } else {
        // Redirect to therapist dashboard
        setTimeout(() => {
          navigate('/therapist-dashboard');
        }, 2000);
      }
      
      toast.success('Registration submitted successfully! Your application is under review.');
      navigate('/therapist-dashboard');

    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return registrationData.licenseNumber && registrationData.licenseState && 
               registrationData.licenseExpiry && registrationData.professionalTitle;
      case 2:
        return registrationData.education[0].degree && registrationData.education[0].institution;
      case 3:
        return registrationData.bio && registrationData.approachDescription;
      case 4:
        return registrationData.hourlyRate > 0 && registrationData.specializations.length > 0;
      case 5:
        return registrationData.hipaaTrainingCompleted && registrationData.backgroundCheckCompleted;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className={isEmbedded ? "" : "min-h-screen bg-gray-50"}>
      {!isEmbedded && <Navbar />}
      <main className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${isEmbedded ? "" : "py-24"}`}>
        {!isEmbedded && (
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-3 mb-4"
            >
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Become a Therapist
              </h1>
            </motion.div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our platform as a licensed mental health professional. Help clients on their wellness journey 
              while building your practice with complete flexibility.
            </p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Step {step.id}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= step.id ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: License & Credentials */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">License & Credentials</h2>
                      <p className="text-gray-600">Provide your professional licensing information for verification.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Number *
                        </label>
                        <input
                          type="text"
                          value={registrationData.licenseNumber}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your license number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License State *
                        </label>
                        <select
                          value={registrationData.licenseState}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, licenseState: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select state</option>
                          {usStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={registrationData.licenseExpiry}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years of Experience *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={registrationData.yearsExperience}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Title *
                      </label>
                      <select
                        value={registrationData.professionalTitle}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, professionalTitle: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select your professional title</option>
                        {professionalTitles.map(title => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Education & Experience */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Education & Experience</h2>
                      <p className="text-gray-600">Add your educational background and professional certifications.</p>
                    </div>

                    {/* Education */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addEducation}
                          leftIcon={<Award size={16} />}
                        >
                          Add Education
                        </Button>
                      </div>

                      {registrationData.education.map((edu, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                            {registrationData.education.length > 1 && (
                              <button
                                onClick={() => removeEducation(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Degree *
                              </label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Master of Social Work"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Institution *
                              </label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., University of California"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Graduation Year
                              </label>
                              <input
                                type="number"
                                min="1950"
                                max={new Date().getFullYear()}
                                value={edu.year}
                                onChange={(e) => updateEducation(index, 'year', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field of Study
                              </label>
                              <input
                                type="text"
                                value={edu.fieldOfStudy}
                                onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Clinical Psychology"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Certifications */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Certifications (Optional)</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addCertification}
                          leftIcon={<Award size={16} />}
                        >
                          Add Certification
                        </Button>
                      </div>

                      {registrationData.certifications.map((cert, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium text-gray-900">Certification {index + 1}</h4>
                            <button
                              onClick={() => removeCertification(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certification Name
                              </label>
                              <input
                                type="text"
                                value={cert.name}
                                onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Certified CBT Therapist"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issuing Organization
                              </label>
                              <input
                                type="text"
                                value={cert.issuingOrganization}
                                onChange={(e) => updateCertification(index, 'issuingOrganization', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., American Board of Professional Psychology"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Date
                              </label>
                              <input
                                type="date"
                                value={cert.issueDate}
                                onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date (Optional)
                              </label>
                              <input
                                type="date"
                                value={cert.expiryDate}
                                onChange={(e) => updateCertification(index, 'expiryDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {registrationData.certifications.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                          <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No certifications added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Professional Profile */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Profile</h2>
                      <p className="text-gray-600">Tell clients about your approach and experience.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Bio *
                      </label>
                      <textarea
                        value={registrationData.bio}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Describe your background, experience, and what makes you unique as a therapist..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will be visible to potential clients. Be professional and welcoming.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Therapeutic Approach *
                      </label>
                      <textarea
                        value={registrationData.approachDescription}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, approachDescription: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Describe your therapeutic approach, methodologies you use, and your philosophy..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Languages Spoken
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {registrationData.languagesSpoken.map((lang, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {lang}
                            {lang !== 'English' && (
                              <button
                                onClick={() => setRegistrationData(prev => ({
                                  ...prev,
                                  languagesSpoken: prev.languagesSpoken.filter((_, i) => i !== index)
                                }))}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Add a language"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = (e.target as HTMLInputElement).value.trim();
                              if (value && !registrationData.languagesSpoken.includes(value)) {
                                setRegistrationData(prev => ({
                                  ...prev,
                                  languagesSpoken: [...prev.languagesSpoken, value]
                                }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={registrationData.timezone}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Anchorage">Alaska Time (AKT)</option>
                        <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Services & Pricing */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Services & Pricing</h2>
                      <p className="text-gray-600">Set your rates and define the services you offer.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hourly Rate (USD) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="number"
                            min="50"
                            max="500"
                            value={registrationData.hourlyRate}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="100"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Typical range: $75-$200 per hour
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Types *
                        </label>
                        <div className="space-y-2">
                          {sessionTypes.map(type => (
                            <label key={type.value} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={registrationData.sessionTypes.includes(type.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRegistrationData(prev => ({
                                      ...prev,
                                      sessionTypes: [...prev.sessionTypes, type.value]
                                    }));
                                  } else {
                                    setRegistrationData(prev => ({
                                      ...prev,
                                      sessionTypes: prev.sessionTypes.filter(t => t !== type.value)
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Specializations */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specializations * (Select at least one)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {specializations.map(spec => (
                          <button
                            key={spec.name}
                            type="button"
                            onClick={() => addSpecialization(spec)}
                            disabled={registrationData.specializations.find(s => s.specialization === spec.name)}
                            className={`text-left p-3 rounded-lg border transition-all text-sm ${
                              registrationData.specializations.find(s => s.specialization === spec.name)
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {spec.name}
                          </button>
                        ))}
                      </div>

                      {/* Selected Specializations */}
                      {registrationData.specializations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Selected Specializations:</h4>
                          {registrationData.specializations.map((spec, index) => (
                            <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                              <div>
                                <span className="font-medium text-blue-900">{spec.specialization}</span>
                                <span className="text-sm text-blue-700 ml-2">({spec.category})</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <select
                                  value={spec.experienceLevel}
                                  onChange={(e) => updateSpecializationLevel(index, e.target.value as any)}
                                  className="text-sm border border-blue-300 rounded px-2 py-1"
                                >
                                  <option value="beginner">Beginner</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="expert">Expert</option>
                                </select>
                                <button
                                  onClick={() => removeSpecialization(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Insurance */}
                    <div>
                      <label className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          checked={registrationData.acceptsInsurance}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, acceptsInsurance: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">I accept insurance</span>
                      </label>

                      {registrationData.acceptsInsurance && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Insurance Networks
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {insuranceNetworks.map(network => (
                              <label key={network} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={registrationData.insuranceNetworks.includes(network)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRegistrationData(prev => ({
                                        ...prev,
                                        insuranceNetworks: [...prev.insuranceNetworks, network]
                                      }));
                                    } else {
                                      setRegistrationData(prev => ({
                                        ...prev,
                                        insuranceNetworks: prev.insuranceNetworks.filter(n => n !== network)
                                      }));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{network}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Compliance & Verification */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Compliance & Verification</h2>
                      <p className="text-gray-600">Complete the required compliance steps to join our platform.</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-yellow-900">Required Compliance Steps</h3>
                          <p className="text-sm text-yellow-800 mt-1">
                            These steps are required by law to provide mental health services on our platform.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">HIPAA Training</h3>
                              <p className="text-sm text-gray-600">Complete HIPAA compliance training</p>
                            </div>
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={registrationData.hipaaTrainingCompleted}
                              onChange={(e) => setRegistrationData(prev => ({ 
                                ...prev, 
                                hipaaTrainingCompleted: e.target.checked,
                                hipaaTrainingDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined
                              }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Completed</span>
                          </label>
                        </div>
                        {registrationData.hipaaTrainingCompleted && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Training Completion Date
                            </label>
                            <input
                              type="date"
                              value={registrationData.hipaaTrainingDate}
                              onChange={(e) => setRegistrationData(prev => ({ ...prev, hipaaTrainingDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">Background Check</h3>
                              <p className="text-sm text-gray-600">Complete background verification</p>
                            </div>
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={registrationData.backgroundCheckCompleted}
                              onChange={(e) => setRegistrationData(prev => ({ 
                                ...prev, 
                                backgroundCheckCompleted: e.target.checked,
                                backgroundCheckDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined
                              }))}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Completed</span>
                          </label>
                        </div>
                        {registrationData.backgroundCheckCompleted && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Background Check Date
                            </label>
                            <input
                              type="date"
                              value={registrationData.backgroundCheckDate}
                              onChange={(e) => setRegistrationData(prev => ({ ...prev, backgroundCheckDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your application will be reviewed by our verification team</li>
                        <li>• We'll verify your license and credentials</li>
                        <li>• You'll receive an email within 3-5 business days</li>
                        <li>• Once approved, you can start accepting clients</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                leftIcon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  rightIcon={<ArrowRight size={16} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  isLoading={isSubmitting}
                  rightIcon={<CheckCircle size={16} />}
                  className="bg-gradient-to-r from-green-500 to-blue-500"
                >
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

const TherapistRegistration: React.FC = () => {
  return <TherapistRegistrationForm />;
};

export default TherapistRegistration;