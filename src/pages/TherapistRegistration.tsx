import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  GraduationCap, 
  FileText, 
  DollarSign, 
  Clock, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Globe,
  Users,
  Heart,
  Brain,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

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

interface TherapistRegistrationFormProps {
  isEmbedded?: boolean;
  onComplete?: () => void;
}

export const TherapistRegistrationForm: React.FC<TherapistRegistrationFormProps> = ({ 
  isEmbedded = false, 
  onComplete 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: License Information
    license_number: '',
    license_state: '',
    license_expiry: '',
    professional_title: '',
    years_experience: 1,
    
    // Step 2: Education
    education: [] as Education[],
    
    // Step 3: Certifications
    certifications: [] as Certification[],
    
    // Step 4: Professional Information
    bio: '',
    approach_description: '',
    languages_spoken: ['English'],
    specializations: [] as string[],
    
    // Step 5: Services & Pricing
    hourly_rate: 100,
    session_types: ['individual'] as string[],
    accepts_insurance: false,
    insurance_networks: [] as string[],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Temporary form states
  const [newEducation, setNewEducation] = useState<Education>({
    degree: '',
    institution: '',
    year: new Date().getFullYear(),
    field_of_study: ''
  });
  
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: ''
  });

  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newInsuranceNetwork, setNewInsuranceNetwork] = useState('');

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
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
    'Licensed Addiction Counselor (LAC)',
    'Other'
  ];

  const commonSpecializations = [
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
    'Stress Management',
    'Life Transitions',
    'Anger Management',
    'Self-Esteem Issues'
  ];

  const sessionTypes = [
    { value: 'individual', label: 'Individual Therapy' },
    { value: 'couples', label: 'Couples Therapy' },
    { value: 'family', label: 'Family Therapy' },
    { value: 'group', label: 'Group Therapy' }
  ];

  const commonInsuranceNetworks = [
    'Aetna',
    'Anthem',
    'Blue Cross Blue Shield',
    'Cigna',
    'Humana',
    'Kaiser Permanente',
    'Medicaid',
    'Medicare',
    'UnitedHealth',
    'Tricare'
  ];

  // Add education entry
  const addEducation = () => {
    if (newEducation.degree && newEducation.institution && newEducation.field_of_study) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, newEducation]
      }));
      setNewEducation({
        degree: '',
        institution: '',
        year: new Date().getFullYear(),
        field_of_study: ''
      });
    }
  };

  // Remove education entry
  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Add certification
  const addCertification = () => {
    if (newCertification.name && newCertification.issuing_organization && newCertification.issue_date) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification]
      }));
      setNewCertification({
        name: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        credential_id: ''
      });
    }
  };

  // Remove certification
  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // Add language
  const addLanguage = () => {
    if (newLanguage && !formData.languages_spoken.includes(newLanguage)) {
      setFormData(prev => ({
        ...prev,
        languages_spoken: [...prev.languages_spoken, newLanguage]
      }));
      setNewLanguage('');
    }
  };

  // Remove language
  const removeLanguage = (language: string) => {
    if (language !== 'English') { // Don't allow removing English
      setFormData(prev => ({
        ...prev,
        languages_spoken: prev.languages_spoken.filter(lang => lang !== language)
      }));
    }
  };

  // Add specialization
  const addSpecialization = (specialization: string) => {
    if (!formData.specializations.includes(specialization)) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    }
  };

  // Remove specialization
  const removeSpecialization = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(spec => spec !== specialization)
    }));
  };

  // Add insurance network
  const addInsuranceNetwork = (network: string) => {
    if (!formData.insurance_networks.includes(network)) {
      setFormData(prev => ({
        ...prev,
        insurance_networks: [...prev.insurance_networks, network]
      }));
    }
  };

  // Remove insurance network
  const removeInsuranceNetwork = (network: string) => {
    setFormData(prev => ({
      ...prev,
      insurance_networks: prev.insurance_networks.filter(net => net !== network)
    }));
  };

  // Handle session type toggle
  const toggleSessionType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      session_types: prev.session_types.includes(type)
        ? prev.session_types.filter(t => t !== type)
        : [...prev.session_types, type]
    }));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to complete registration');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create or update therapist profile
      const { data: existingProfile, error: checkError } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const profileData = {
        user_id: user.id,
        license_number: formData.license_number,
        license_state: formData.license_state,
        license_expiry: formData.license_expiry,
        verification_status: 'pending',
        professional_title: formData.professional_title,
        years_experience: formData.years_experience,
        education: formData.education,
        certifications: formData.certifications,
        bio: formData.bio,
        approach_description: formData.approach_description,
        languages_spoken: formData.languages_spoken,
        hourly_rate: formData.hourly_rate,
        session_types: formData.session_types,
        accepts_insurance: formData.accepts_insurance,
        insurance_networks: formData.insurance_networks,
        timezone: formData.timezone,
        is_active: true,
        hipaa_training_completed: false,
        background_check_completed: false
      };

      let profileId;

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('therapist_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
          .select('id')
          .single();

        if (error) throw error;
        profileId = data.id;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('therapist_profiles')
          .insert([profileData])
          .select('id')
          .single();

        if (error) throw error;
        profileId = data.id;
      }

      // Add specializations
      if (formData.specializations.length > 0) {
        // First, delete existing specializations
        await supabase
          .from('therapist_specializations')
          .delete()
          .eq('therapist_id', profileId);

        // Then add new ones
        const specializationData = formData.specializations.map(spec => ({
          therapist_id: profileId,
          specialization: spec,
          category: 'mental_health',
          experience_level: 'intermediate'
        }));

        const { error: specError } = await supabase
          .from('therapist_specializations')
          .insert(specializationData);

        if (specError) throw specError;
      }

      // Auto-approve for testing (simulate admin approval after 2 seconds)
      setTimeout(async () => {
        try {
          await supabase
            .from('therapist_profiles')
            .update({ 
              verification_status: 'verified',
              hipaa_training_completed: true,
              hipaa_training_date: new Date().toISOString().split('T')[0],
              background_check_completed: true,
              background_check_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', profileId);

          toast.success('🎉 Registration completed and auto-approved for testing!');
        } catch (error) {
          console.error('Auto-approval error:', error);
        }
      }, 2000);

      toast.success('Registration submitted successfully! You will be notified once approved.');
      
      // Send notification to admin for new therapist application
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Admin user ID - replace with actual admin ID
            title: 'New Therapist Application',
            message: `${formData.professional_title} ${user.user_metadata?.full_name || 'Unknown'} has submitted a therapist application for review.`,
            type: 'alert',
            priority: 'high',
            read: false,
            action_url: '/admin',
            action_text: 'Review Application',
            metadata: {
              therapist_id: profileId,
              applicant_name: user.user_metadata?.full_name,
              license_state: formData.license_state,
              professional_title: formData.professional_title
            }
          }]);
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      if (onComplete) {
        onComplete();
      } else {
        navigate('/therapist-dashboard');
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.license_number && formData.license_state && formData.license_expiry && 
               formData.professional_title && formData.years_experience;
      case 2:
        return formData.education.length > 0;
      case 3:
        return true; // Certifications are optional
      case 4:
        return formData.bio && formData.approach_description && formData.specializations.length > 0;
      case 5:
        return formData.hourly_rate > 0 && formData.session_types.length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LIC123456"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="license_state" className="block text-sm font-medium text-gray-700 mb-1">
                    License State *
                  </label>
                  <select
                    id="license_state"
                    value={formData.license_state}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                    License Expiry Date *
                  </label>
                  <input
                    type="date"
                    id="license_expiry"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_expiry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    id="years_experience"
                    min="0"
                    max="50"
                    value={formData.years_experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="professional_title" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Title *
                </label>
                <select
                  id="professional_title"
                  value={formData.professional_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, professional_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Title</option>
                  {professionalTitles.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
              
              {/* Add Education Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Education</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Degree *
                    </label>
                    <input
                      type="text"
                      value={newEducation.degree}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Master of Social Work"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution *
                    </label>
                    <input
                      type="text"
                      value={newEducation.institution}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., University of California"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={newEducation.year}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field of Study *
                    </label>
                    <input
                      type="text"
                      value={newEducation.field_of_study}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, field_of_study: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Clinical Psychology"
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={addEducation}
                  disabled={!newEducation.degree || !newEducation.institution || !newEducation.field_of_study}
                  className="mt-3"
                  leftIcon={<GraduationCap size={16} />}
                >
                  Add Education
                </Button>
              </div>
              
              {/* Education List */}
              <div className="space-y-3">
                {formData.education.map((edu, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                        <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                        <p className="text-sm text-gray-500">{edu.field_of_study}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                {formData.education.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No education entries added yet. Please add at least one.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications (Optional)</h3>
              
              {/* Add Certification Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Certification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certification Name
                    </label>
                    <input
                      type="text"
                      value={newCertification.name}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Certified Clinical Trauma Professional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issuing Organization
                    </label>
                    <input
                      type="text"
                      value={newCertification.issuing_organization}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issuing_organization: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., International Association for Trauma Professionals"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={newCertification.issue_date}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issue_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={newCertification.expiry_date}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCertification.credential_id}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, credential_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Certification ID or number"
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={addCertification}
                  disabled={!newCertification.name || !newCertification.issuing_organization || !newCertification.issue_date}
                  className="mt-3"
                  leftIcon={<Award size={16} />}
                >
                  Add Certification
                </Button>
              </div>
              
              {/* Certifications List */}
              <div className="space-y-3">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                        <p className="text-sm text-gray-500">
                          Issued: {new Date(cert.issue_date).toLocaleDateString()}
                          {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                        </p>
                        {cert.credential_id && (
                          <p className="text-xs text-gray-500">ID: {cert.credential_id}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCertification(index)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                {formData.certifications.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No certifications added yet. This step is optional.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio *
                  </label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Tell potential clients about your background, experience, and what makes you unique as a therapist..."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="approach_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Therapeutic Approach *
                  </label>
                  <textarea
                    id="approach_description"
                    value={formData.approach_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, approach_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe your therapeutic approach, methodologies, and treatment philosophy..."
                    required
                  />
                </div>
                
                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Languages Spoken
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a language..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    />
                    <Button
                      type="button"
                      onClick={addLanguage}
                      disabled={!newLanguage}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.languages_spoken.map((language) => (
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
                
                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specializations *
                  </label>
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Common specializations:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonSpecializations.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => addSpecialization(spec)}
                          disabled={formData.specializations.includes(spec)}
                          className={`text-xs px-3 py-1 rounded-full ${
                            formData.specializations.includes(spec)
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add custom specialization..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), newSpecialization && addSpecialization(newSpecialization), setNewSpecialization(''))}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newSpecialization) {
                          addSpecialization(newSpecialization);
                          setNewSpecialization('');
                        }
                      }}
                      disabled={!newSpecialization}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(spec)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {formData.specializations.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please add at least one specialization.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services & Pricing</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      id="hourly_rate"
                      min="50"
                      max="500"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 100 }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You keep 85% of session fees. Platform fee: 15%
                  </p>
                </div>
                
                {/* Session Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Types Offered *
                  </label>
                  <div className="space-y-2">
                    {sessionTypes.map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.session_types.includes(type.value)}
                          onChange={() => toggleSessionType(type.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.session_types.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one session type.</p>
                  )}
                </div>
                
                {/* Insurance */}
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={formData.accepts_insurance}
                      onChange={(e) => setFormData(prev => ({ ...prev, accepts_insurance: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">I accept insurance</span>
                  </label>
                  
                  {formData.accepts_insurance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Networks
                      </label>
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-2">Common networks:</p>
                        <div className="flex flex-wrap gap-2">
                          {commonInsuranceNetworks.map((network) => (
                            <button
                              key={network}
                              type="button"
                              onClick={() => addInsuranceNetwork(network)}
                              disabled={formData.insurance_networks.includes(network)}
                              className={`text-xs px-3 py-1 rounded-full ${
                                formData.insurance_networks.includes(network)
                                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {network}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newInsuranceNetwork}
                          onChange={(e) => setNewInsuranceNetwork(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add custom insurance network..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), newInsuranceNetwork && addInsuranceNetwork(newInsuranceNetwork), setNewInsuranceNetwork(''))}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (newInsuranceNetwork) {
                              addInsuranceNetwork(newInsuranceNetwork);
                              setNewInsuranceNetwork('');
                            }
                          }}
                          disabled={!newInsuranceNetwork}
                        >
                          Add
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formData.insurance_networks.map((network) => (
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
                
                {/* Timezone */}
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep
                  ? 'bg-blue-600 text-white'
                  : step < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? <CheckCircle size={16} /> : step}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          Step {currentStep} of 5
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <div className="p-6">
          {renderStep()}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          leftIcon={<ArrowLeft size={16} />}
        >
          Previous
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={nextStep}
          disabled={!canProceed()}
          isLoading={isSubmitting && currentStep === 5}
          rightIcon={currentStep === 5 ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
          className="bg-gradient-to-r from-blue-500 to-purple-500"
        >
          {currentStep === 5 ? 'Complete Registration' : 'Next'}
        </Button>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Therapist Registration</h1>
          <p className="text-gray-600">
            Please provide your professional information to start accepting clients
          </p>
        </div>
        
        {content}
      </main>
    </div>
  );
};

const TherapistRegistration: React.FC = () => {
  return <TherapistRegistrationForm />;
};

export default TherapistRegistration;