import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PenTool, BarChart, Mic } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const Hero: React.FC = () => {
  const { user } = useAuth();
  
  const handleSignupClick = () => {
    // Find the Sign Up button in the navbar and click it
    const signUpButton = document.querySelector('button:has(.lucide-user-plus)') as HTMLButtonElement;
    if (signUpButton) {
      signUpButton.click();
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-white to-lavender-50 overflow-hidden">
      {/* Animation elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-1/4 w-64 h-64 bg-sage-300 rounded-full mix-blend-multiply filter blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-40 right-1/4 w-64 h-64 bg-lavender-300 rounded-full mix-blend-multiply filter blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }}
        className="absolute -bottom-32 left-1/3 w-64 h-64 bg-lavender-400 rounded-full mix-blend-multiply filter blur-3xl"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
          >
            <h1>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="block text-sm font-semibold uppercase tracking-wide text-lavender-600"
              >
                Introducing PureMind AI
              </motion.span>
              <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="block text-gray-900"
                >
                  Your Digital
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="block bg-gradient-to-r from-lavender-600 to-sage-500 bg-clip-text text-transparent"
                >
                  Mental Wellness Companion
                </motion.span>
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl"
            >
              PureMind AI helps you track your emotional journey through intelligent journaling, mood analysis, and personalized wellness insights.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="primary" 
                    size="lg"
                    rightIcon={<ArrowRight size={18} />}
                    onClick={handleSignupClick}
                  >
                    Start Your Journey
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      if (featuresSection) {
                        featuresSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    Learn More
                  </Button>
                </motion.div>
              </div>
              
              <p className="mt-5 text-sm text-gray-500">
                Your data is secure and private. No credit card required.
              </p>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
          >
            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative block w-full rounded-lg overflow-hidden bg-white p-2"
              >
                <div className="bg-lavender-50 rounded-lg overflow-hidden shadow-inner">
                  <div className="p-5 space-y-4">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="flex items-center"
                    >
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-lavender-100">
                          <PenTool className="h-5 w-5 text-lavender-600" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">Digital Journaling</h3>
                        <p className="text-sm text-gray-500">Express your thoughts and feelings</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="flex items-center"
                    >
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-sage-100">
                          <Mic className="h-5 w-5 text-sage-600" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">Voice Check-ins</h3>
                        <p className="text-sm text-gray-500">Record your emotional state</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="flex items-center"
                    >
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-lavender-100">
                          <BarChart className="h-5 w-5 text-lavender-600" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">Mood Tracking</h3>
                        <p className="text-sm text-gray-500">Visualize your emotional progress</p>
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="bg-white p-5 border-t border-gray-200 rounded-b-lg">
                    <motion.div
                      animate={{ 
                        opacity: [0.5, 1, 0.5],
                        scale: [0.98, 1, 0.98]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="flex space-x-4"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="h-2 bg-lavender-200 rounded"></div>
                        <div className="h-2 bg-lavender-200 rounded"></div>
                        <div className="h-2 bg-lavender-200 rounded w-1/2"></div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;