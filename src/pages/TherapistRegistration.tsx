import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Calendar, MapPin, Image, Upload, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import { sendAdminNotification } from '../utils/adminNotifications';
import { supabase } from '../../lib/supabase';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose }) => {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [accountType, setAccountType] = useState<'patient' | 'therapist'>('patient');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      setProfileImage(file);
      
      // Create preview
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              user_type: accountType,
              is_therapist: accountType === 'therapist',
              birthdate,
              location,
              bio
            },
          },
        });

        if (signUpError) throw signUpError;

        // If therapist account, create therapist profile
        if (accountType === 'therapist' && signUpData.user) {
          const { error: profileError } = await supabase
            .from('therapist_profiles')
            .insert([{
              user_id: signUpData.user.id,
              license_number: '', // Will be filled in registration
              license_state: '', // Will be filled in registration
              license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              verification_status: 'pending',
              professional_title: '',
              years_experience: 0,
              education: [],
              certifications: [],
              bio: '',
              approach_description: '',
              languages_spoken: ['English'],
              hourly_rate: 0,
              session_types: ['individual'],
              accepts_insurance: false,
              insurance_networks: [],
              timezone: 'UTC',
              is_active: false, // Will be activated after full registration
              hipaa_training_completed: false,
              background_check_completed: false
            }]);

          if (profileError) {
            console.error('Error creating therapist profile:', profileError);
          }
          
          // Send notification to admin for new therapist signup
          try {
            console.log('🔔 Sending admin notification for new therapist account...');
            
            // Try to find admin user by email
            const { data: adminUser, error: adminError } = await supabase
              .from('users')
              .select('id, email')
              .eq('email', 'youssef.arafat09@gmail.com')
              .maybeSingle();

            console.log('Admin user lookup result:', { adminUser, adminError });

            let adminUserId = null;

            if (adminUser && !adminError) {
              adminUserId = adminUser.id;
              console.log('✅ Found admin user via email lookup:', adminUserId);
            } else {
              // Fallback to localStorage
              const storedAdminId = localStorage.getItem('admin_user_id');
              if (storedAdminId) {
                adminUserId = storedAdminId;
                console.log('✅ Using stored admin ID from localStorage:', adminUserId);
              }
            }

            if (adminUserId) {
              const notificationData = {
                user_id: adminUserId,
                title: 'New Therapist Account Created',
                message: `${name} (${email}) has created a therapist account and needs to complete registration.`,
                type: 'info',
                priority: 'medium',
                read: false,
                action_url: '/admin',
                action_text: 'View Account',
                metadata: {
                  new_user_id: signUpData.user.id,
                  user_email: email,
                  user_name: name,
                  account_type: accountType
                }
              };

              console.log('📤 Sending account creation notification to admin:', notificationData);

              const { data: notificationResult, error: notificationError } = await supabase
                .from('user_notifications')
                .insert([notificationData])
                .select();

              if (notificationError) {
                console.error('❌ Error creating admin notification:', notificationError);
              } else {
                console.log('✅ Admin notification created successfully:', notificationResult);
              }
            } else {
              console.error('❌ No admin user ID available - notification not sent');
            }
          } catch (notificationError) {
            console.error('Error sending admin notification:', notificationError);
          }
        }
      } else {
        // Sign in therapist
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Verify this is a therapist account
        if (signInData.user) {
          const userType = signInData.user.user_metadata?.user_type;
          const isTherapist = signInData.user.user_metadata?.is_therapist;
          
          if (userType !== 'therapist' && !isTherapist) {
            await supabase.auth.signOut();
            throw new Error('This account is not registered as a therapist account. Please use the patient login or create a therapist account.');
          }
        }

        toast.success('Successfully signed in as therapist!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative p-6">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {mode === 'signin' ? 'Therapist Sign In' : 'Therapist Registration'}
                </h2>
              </div>
              <p className="text-gray-600">
                {mode === 'signin' 
                  ? 'Access your therapist dashboard'
                  : 'Join as a licensed mental health professional'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
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
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                      <option value="FL">Florida</option>
                      <option value="IL">Illinois</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="OH">Ohio</option>
                      <option value="GA">Georgia</option>
                      <option value="NC">North Carolina</option>
                      <option value="MI">Michigan</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Email *
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="dr.smith@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Professional Requirements:</p>
                      <ul className="space-y-0.5">
                        <li>• Valid state license required</li>
                        <li>• Background check will be conducted</li>
                        <li>• HIPAA training verification needed</li>
                        <li>• Professional liability insurance required</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight size={18} />}
                className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                {mode === 'signin' 
                  ? 'Sign In to Dashboard' 
                  : 'Create Therapist Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? (
                  <>
                    Don't have a therapist account?{' '}
                    <button
                      onClick={() => onClose()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Register here
                    </button>
                  </>
                ) : (
                  <>
                    Already have a therapist account?{' '}
                    <button
                      onClick={() => onClose()}
              await supabase
                .from('user_notifications')
                .insert([{
                  user_id: adminUsers.id,
                  title: 'New Therapist Account Created',
                  message: `${name} (${email}) has created a therapist account and needs to complete registration.`,
                  type: 'info',
                  priority: 'medium',
                  read: false,
                  action_url: '/admin',
                  action_text: 'View Account',
                  metadata: {
                    new_user_id: signUpData.user.id,
                    user_email: email,
                    user_name: name
                  }
                }]);
            }

            // Also log the account creation
            await supabase
              .from('therapist_applications_log')
              .insert([{
                therapist_id: null,
                applicant_name: name,
                applicant_email: email,
                professional_title: 'Account Created',
                license_state: '',
                status: 'account_created',
                submitted_at: new Date().toISOString()
              }]);
          } catch (notificationError) {
            console.error('Error sending admin notification:', notificationError);
          }
        }

        // If profile image was uploaded, store it
        if (profileImage && signUpData.user) {
          const userId = signUpData.user.id;
          const fileExt = profileImage.name.split('.').pop();
          const fileName = `${userId}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('profile_images')
            .upload(fileName, profileImage);
            
          if (uploadError) {
            console.error('Error uploading profile image:', uploadError);
            toast.error('Profile created but image upload failed');
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('profile_images')
              .getPublicUrl(fileName);
              
            // Update user profile with image URL
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                avatar_url: publicUrlData.publicUrl
              }
            });
            
            if (updateError) {
              console.error('Error updating profile with image:', updateError);
            }
          }
        }

        toast.success('Therapist account created! Redirecting to complete your registration...');
        
        // Redirect to therapist dashboard after a brief delay
        setTimeout(() => {
          onClose();
          // Force a page refresh to ensure proper routing
          window.location.reload();
        }, 1500);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check account type and redirect appropriately
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        if (signedInUser) {
          const userType = signedInUser.user_metadata?.user_type;
          const isTherapist = signedInUser.user_metadata?.is_therapist;
          
          if (userType === 'therapist' || isTherapist) {
            // Redirect therapist to therapist dashboard
            onClose();
            // Force a page refresh to ensure proper routing
            window.location.reload();
          }
        }
        toast.success('Successfully signed in!');
      }

      if (mode === 'signin') {
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative p-6">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mb-6">
              {mode === 'signin' 
                ? 'Sign in to continue your wellness journey'
                : 'Join PureMind AI to start your wellness journey'}
            </p>

            {/* Social Sign In Options */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleGoogleSignIn}
                isLoading={isGoogleLoading}
                className="flex items-center justify-center"
              >
                {!isGoogleLoading && <FcGoogle size={20} className="mr-2" />}
                Continue with Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              {mode === 'signup' && (
                <>
                  {currentStep === 1 && (
                    <>
                      {/* Account Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Type*
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAccountType('patient')}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              accountType === 'patient'
                                ? 'border-lavender-500 bg-lavender-50 text-lavender-900'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">Patient</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Seeking mental health support
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountType('therapist')}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              accountType === 'therapist'
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">Therapist</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Licensed mental health professional
                            </div>
                          </button>
                        </div>
                        {accountType === 'therapist' && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                              <strong>Note:</strong> Therapist accounts require license verification and professional credentials.
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                            placeholder="••••••••"
                            minLength={6}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Password must be at least 6 characters long
                        </p>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div>
                        <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth (Optional)
                        </label>
                        <div className="relative">
                          <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            id="birthdate"
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                          Location (Optional)
                        </label>
                        <div className="relative">
                          <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                          About You (Optional)
                        </label>
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                          placeholder="Tell us a bit about yourself..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profile Picture (Optional)
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          <div 
                            className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100"
                          >
                            {imagePreview ? (
                              <img 
                                src={imagePreview} 
                                alt="Profile preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={24} className="text-gray-400" />
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
                                onClick={triggerFileInput}
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
                                  onClick={triggerFileInput}
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
                        <p className="text-xs text-gray-500 mt-2">
                          Max file size: 5MB. Recommended: square image.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {mode === 'signin' && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        placeholder="••••••••"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <button 
                        type="button"
                        className="text-xs text-lavender-600 hover:text-lavender-800"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight size={18} />}
                className="mt-6"
              >
                {mode === 'signin' 
                  ? 'Sign In' 
                  : currentStep === 1 
                    ? 'Next: Profile Details' 
                    : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => onClose()}
                      className="text-lavender-600 hover:text-lavender-700 font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => onClose()}
                      className="text-lavender-600 hover:text-lavender-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;