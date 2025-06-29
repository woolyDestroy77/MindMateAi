import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const CTASection: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  
  return (
    <section className="py-16 bg-gradient-to-r from-lavender-600 to-sage-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Begin Your Wellness Journey Today
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-white opacity-90 mx-auto">
            Take the first step toward better mental wellbeing with PureMind AI's personalized support.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-lavender-600 hover:bg-gray-100 hover:text-lavender-700"
              onClick={() => {}}
            >
              Try PureMind AI for Free
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 flex items-center justify-center"
              onClick={signInWithGoogle}
            >
              <FcGoogle size={20} className="mr-2" />
              Sign up with Google
            </Button>
          </div>
          
          <p className="mt-4 text-sm text-white opacity-75">
            No credit card required. Start with our free plan and upgrade anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;