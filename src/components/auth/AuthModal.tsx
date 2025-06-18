import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Calendar, MapPin, Image, Upload, Trash2, Apple, Github } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { FcGoogle } from 'react-icons/fc';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
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
              birthdate,
              location,
              bio
            },
          },
        });

        if (signUpError) throw signUpError;

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

        toast.success('Check your email to confirm your account!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        toast.success('Successfully signed in!');
      }

      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Apple');
    } finally {
      setIsAppleLoading(false);
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
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleAppleSignIn}
                isLoading={isAppleLoading}
                className="flex items-center justify-center"
              >
                {!isAppleLoading && <Apple size={20} className="mr-2 text-black" />}
                Continue with Apple
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