import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Shield, Award, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { FcGoogle } from 'react-icons/fc';

interface TherapistAuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}

const TherapistAuthModal: React.FC<TherapistAuthModalProps> = ({ mode, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Create therapist account with special metadata
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: 'therapist',
              license_number: licenseNumber,
              license_state: licenseState,
              is_therapist: true
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Create therapist profile entry
          const { error: profileError } = await supabase
            .from('therapist_profiles')
            .insert([{
              user_id: signUpData.user.id,
              license_number: licenseNumber,
              license_state: licenseState,
              license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
              verification_status: 'pending',
              professional_title: 'Licensed Therapist',
              years_experience: 1,
              education: [],
              certifications: [],
              bio: 'Professional therapist ready to help clients.',
              approach_description: 'Evidence-based therapeutic approaches.',
              languages_spoken: ['English'],
              hourly_rate: 100,
              session_types: ['individual'],
              accepts_insurance: false,
              insurance_networks: [],
              timezone: 'UTC',
              is_active: true,
              hipaa_training_completed: false,
              background_check_completed: false
            }]);

          if (profileError) {
            console.error('Error creating therapist profile:', profileError);
            // Don't throw here, just log - the auth account was created successfully
          }
        }

        toast.success('Therapist account created! Please check your email to verify your account.');
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
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Patient account? <a href="/" className="text-blue-600 hover:text-blue-700">Go to patient portal</a>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TherapistAuthModal;