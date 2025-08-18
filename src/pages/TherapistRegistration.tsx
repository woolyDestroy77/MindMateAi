import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import TherapistRegistrationForm from '../components/therapist/TherapistRegistrationForm';
import TherapistAuthModal from '../components/auth/TherapistAuthModal';

const TherapistRegistration: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-6"
          >
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join as a Therapist
            </h1>
          </motion.div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help clients on their mental health journey while building your practice with complete flexibility
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center h-full">
              <div className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Your Own Rates</h3>
                <p className="text-gray-600">
                  Complete control over your pricing. Keep 85% of session fees with transparent, upfront pricing.
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center h-full">
              <div className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
                <p className="text-gray-600">
                  Manage your availability and book sessions on your terms. Work when and how you want.
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center h-full">
              <div className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">HIPAA Compliant</h3>
                <p className="text-gray-600">
                  Secure, encrypted platform with full HIPAA compliance and professional liability coverage.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Auth Options */}
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowSignUp(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Create Therapist Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSignIn(true)}
            >
              Sign In to Dashboard
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            License verification required • Background check included
          </p>
        </div>

        {/* Registration Form */}
        <TherapistRegistrationForm />

        {/* Back to Patient Portal */}
        <div className="text-center mt-12">
          <Link to="/" className="inline-flex items-center text-lavender-600 hover:text-lavender-800">
            <ArrowLeft size={18} className="mr-2" />
            Back to Patient Portal
          </Link>
        </div>
      </main>

      {/* Auth Modals */}
      {showSignIn && (
        <TherapistAuthModal
          mode="signin"
          onClose={() => setShowSignIn(false)}
          onSuccess={() => {
            setShowSignIn(false);
            window.location.href = '/therapist-dashboard';
          }}
        />
      )}

      {showSignUp && (
        <TherapistAuthModal
          mode="signup"
          onClose={() => setShowSignUp(false)}
          onSuccess={() => {
            setShowSignUp(false);
            window.location.href = '/therapist-dashboard';
          }}
        />
      )}
    </div>
  );
};

export default TherapistRegistration;