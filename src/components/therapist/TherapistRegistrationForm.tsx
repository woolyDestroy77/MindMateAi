import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Award, 
  MapPin, 
  Calendar, 
  Upload, 
  Image, 
  Trash2, 
  Shield,
  FileText,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { sendAdminNotification } from '../../utils/adminNotifications';

interface TherapistRegistrationFormProps {
  isEmbedded?: boolean;
  onComplete?: () => void;
}

interface Education {
  degree: string;
  institution: string;
  year: number;
  field_of_study: string;
}

interface Certification {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
}

export const TherapistRegistrationForm: React.FC<TherapistRegistrationFormProps> = ({ 
  isEmbedded = false,
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic Information
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [yearsExperience, setYearsExperience] = useState(1);
  
  // Profile Information
  const [bio, setBio] = useState('');
  const [approachDescription, setApproachDescription] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState(['English']);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [sessionTypes, setSessionTypes] = useState(['individual']);
  const [acceptsInsurance, setAcceptsInsurance] = useState(false);
  const [insuranceNetworks, setInsuranceNetworks] = useState<string[]>([]);
  const [timezone, setTimezone] = useState('UTC');
  
  // Education and Certifications
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  
  // Profile Image
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form inputs
  const [languageInput, setLanguageInput] = useState('');
  const [insuranceInput, setInsuranceInput] = useState('');

  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const sessionTypeOptions = [
    { value: 'individual', label: 'Individual Therapy' },
    { value: 'couples', label: 'Couples Therapy' },
    { value: 'family', label: 'Family Therapy' },
    { value: 'group', label: 'Group Therapy' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEducation = () => {
    setEducation([...education, {
      degree: '',
      institution: '',
      year: new Date().getFullYear(),
      field_of_study: ''
    }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string | number) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      credential_id: ''
    }]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    if (languageInput.trim() && !languagesSpoken.includes(languageInput.trim())) {
      setLanguagesSpoken([...languagesSpoken, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  const removeLanguage = (language: string) => {
    if (language !== 'English') { // Don't allow removing English
      setLanguagesSpoken(languagesSpoken.filter(lang => lang !== language));
    }
  };

  const addInsuranceNetwork = () => {
    if (insuranceInput.trim() && !insuranceNetworks.includes(insuranceInput.trim())) {
      setInsuranceNetworks([...insuranceNetworks, insuranceInput.trim()]);
      setInsuranceInput('');
    }
  };

  const removeInsuranceNetwork = (network: string) => {
    setInsuranceNetworks(insuranceNetworks.filter(net => net !== network));
  };

  const toggleSessionType = (type: string) => {
    if (sessionTypes.includes(type)) {
      if (sessionTypes.length > 1) { // Keep at least one
        setSessionTypes(sessionTypes.filter(t => t !== type));
      }
    } else {
      setSessionTypes([...sessionTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Create/update therapist profile
      const { error: profileError } = await supabase
        .from('therapist_profiles')
        .upsert([{
          user_id: user.id,
          license_number: licenseNumber,
          license_state: licenseState,
          license_expiry: licenseExpiry,
          verification_status: 'pending',
          professional_title: professionalTitle,
          years_experience: yearsExperience,
          education,
          certifications,
          bio,
          approach_description: approachDescription,
          languages_spoken: languagesSpoken,
          hourly_rate: hourlyRate,
          session_types: sessionTypes,
          accepts_insurance: acceptsInsurance,
          insurance_networks: insuranceNetworks,
          timezone,
          is_active: true,
          hipaa_training_completed: false,
          background_check_completed: false
        }], {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Handle profile image upload
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile_images')
          .upload(fileName, profileImage);
          
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('profile_images')
            .getPublicUrl(fileName);
            
          await supabase.auth.updateUser({
            data: { avatar_url: publicUrlData.publicUrl }
          });
        }
      }

      // Send admin notification
      try {
        console.log('🔔 Attempting to send admin notification...');
        
        // Get admin user ID directly from auth users table
        const { data: adminUser, error: adminError } = await supabase
          .from('users')
          .select('id')
          .eq('email', 'youssef.arafat09@gmail.com')
          .single();
          
        if (adminError) {
          console.error('❌ Could not find admin user:', adminError);
        } else if (adminUser) {
          console.log('✅ Found admin user:', adminUser.id);
          
          // Create notification directly in database
          const { data: notification, error: notificationError } = await supabase
            .from('user_notifications')
            .insert([{
              user_id: adminUser.id,
              title: 'New Therapist Application',
              message: `${fullName} has submitted a therapist application for review.`,
              type: 'alert',
              priority: 'high',
              read: false,
              action_url: '/admin',
              action_text: 'Review Application',
              metadata: {
                therapist_id: user.id,
                therapist_name: fullName,
                therapist_email: user.email,
                license_state: licenseState,
                professional_title: professionalTitle
              }
            }])
            .select();
            
          if (notificationError) {
            console.error('❌ Failed to create admin notification:', notificationError);
          } else {
            console.log('✅ Admin notification created successfully:', notification);
          }
        }
        
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      toast.success('Therapist profile updated successfully!');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating therapist profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = fullName && licenseNumber && licenseState && licenseExpiry && professionalTitle;
  const canProceedToStep3 = bio && approachDescription && hourlyRate > 0;
  const canSubmit = education.length > 0 || certifications.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="p-6">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Step {currentStep} of 3
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900">
                {currentStep === 1 && 'Basic Information & License'}
                {currentStep === 2 && 'Professional Profile'}
                {currentStep === 3 && 'Education & Certifications'}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dr. Jane Smith"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      id="professionalTitle"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Licensed Clinical Social Worker"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      License Number *
                    </label>
                    <div className="relative">
                      <Award size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        id="licenseNumber"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="LIC123456"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="licenseState" className="block text-sm font-medium text-gray-700 mb-1">
                      License State *
                    </label>
                    <select
                      id="licenseState"
                      value={licenseState}
                      onChange={(e) => setLicenseState(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select State</option>
                      {stateOptions.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                      License Expiry *
                    </label>
                    <div className="relative">
                      <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        id="licenseExpiry"
                        value={licenseExpiry}
                        onChange={(e) => setLicenseExpiry(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    id="yearsExperience"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 1)}
                    min="0"
                    max="50"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Professional Profile */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio *
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell potential clients about your background, experience, and approach to therapy..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="approachDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Therapeutic Approach *
                  </label>
                  <textarea
                    id="approachDescription"
                    value={approachDescription}
                    onChange={(e) => setApproachDescription(e.target.value)}
                    className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your therapeutic approach, methodologies, and treatment philosophy..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate (USD) *
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                      min="50"
                      max="500"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone *
                    </label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>

                {/* Session Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Types Offered *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {sessionTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={sessionTypes.includes(option.value)}
                          onChange={() => toggleSessionType(option.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="Add a language..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    />
                    <Button type="button" variant="outline" onClick={addLanguage}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languagesSpoken.map((language) => (
                      <span
                        key={language}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {language}
                        {language !== 'English' && (
                          <button
                            type="button"
                            onClick={() => removeLanguage(language)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Insurance */}
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={acceptsInsurance}
                      onChange={(e) => setAcceptsInsurance(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      I accept insurance
                    </span>
                  </label>

                  {acceptsInsurance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Networks
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={insuranceInput}
                          onChange={(e) => setInsuranceInput(e.target.value)}
                          placeholder="e.g., Aetna, Blue Cross Blue Shield..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInsuranceNetwork())}
                        />
                        <Button type="button" variant="outline" onClick={addInsuranceNetwork}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insuranceNetworks.map((network) => (
                          <span
                            key={network}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {network}
                            <button
                              type="button"
                              onClick={() => removeInsuranceNetwork(network)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Education & Certifications */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Education */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Education</h4>
                    <Button type="button" variant="outline" onClick={addEducation} leftIcon={<Plus size={16} />}>
                      Add Education
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {education.map((edu, index) => (
                      <Card key={index} className="p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <h5 className="font-medium text-gray-900">Education #{index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeEducation(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
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
                              placeholder="Ph.D., M.A., B.A., etc."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Field of Study *
                            </label>
                            <input
                              type="text"
                              value={edu.field_of_study}
                              onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                              placeholder="Psychology, Social Work, etc."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              placeholder="University name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Graduation Year *
                            </label>
                            <input
                              type="number"
                              value={edu.year}
                              onChange={(e) => updateEducation(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                              min="1950"
                              max={new Date().getFullYear()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Certifications</h4>
                    <Button type="button" variant="outline" onClick={addCertification} leftIcon={<Plus size={16} />}>
                      Add Certification
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {certifications.map((cert, index) => (
                      <Card key={index} className="p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <h5 className="font-medium text-gray-900">Certification #{index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Certification Name *
                            </label>
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => updateCertification(index, 'name', e.target.value)}
                              placeholder="e.g., Licensed Clinical Social Worker"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Issuing Organization *
                            </label>
                            <input
                              type="text"
                              value={cert.issuing_organization}
                              onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                              placeholder="e.g., State Board of Social Work"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Issue Date *
                            </label>
                            <input
                              type="date"
                              value={cert.issue_date}
                              onChange={(e) => updateCertification(index, 'issue_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expiry Date (Optional)
                            </label>
                            <input
                              type="date"
                              value={cert.expiry_date || ''}
                              onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={32} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      {!imagePreview ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          leftIcon={<Upload size={16} />}
                        >
                          Upload Photo
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            leftIcon={<Image size={16} />}
                          >
                            Change
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            leftIcon={<Trash2 size={16} />}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-8 border-t border-gray-200">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3)
                  }
                  rightIcon={<ArrowRight size={16} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!canSubmit || isSubmitting}
                  leftIcon={<Shield size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Update Profile
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card>

      {/* Requirements Info */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-2">Application Requirements:</h4>
              <ul className="space-y-1">
                <li>• Valid state license with current expiration date</li>
                <li>• Minimum 1 year of professional experience</li>
                <li>• Professional liability insurance (verification required)</li>
                <li>• Background check will be conducted upon approval</li>
                <li>• HIPAA training certification required</li>
                <li>• At least one form of education (degree or certification)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TherapistRegistrationForm;