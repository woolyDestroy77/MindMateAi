import React from 'react';
import { motion } from 'framer-motion';
import { Brain, PenTool, Mic, BarChart2, Globe, Heart, Shield, Zap, Users, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, color, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card variant="elevated" className="h-full">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="space-y-4"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center justify-center p-3 rounded-lg ${color}`}
          >
            {icon}
          </motion.div>
          <h3 className="text-xl font-medium text-gray-900">{title}</h3>
          <p className="text-base text-gray-600">{description}</p>
        </motion.div>
      </Card>
    </motion.div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Brain className="h-6 w-6 text-lavender-600" />,
      title: "Emotion Detection",
      description: "Advanced AI analyzes text and voice to understand your emotional state in real-time.",
      color: "bg-lavender-100"
    },
    {
      icon: <PenTool className="h-6 w-6 text-sage-600" />,
      title: "Digital Journaling",
      description: "Document your thoughts and feelings with our intuitive journaling interface.",
      color: "bg-sage-100"
    },
    {
      icon: <Mic className="h-6 w-6 text-lavender-600" />,
      title: "Voice Check-ins",
      description: "Record voice notes and track your emotional state through voice analysis.",
      color: "bg-lavender-100"
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-sage-600" />,
      title: "Mood Tracking",
      description: "Visualize your emotional journey and identify patterns over time.",
      color: "bg-sage-100"
    },
    {
      icon: <Globe className="h-6 w-6 text-lavender-600" />,
      title: "Multilingual Support",
      description: "Access emotional support in your preferred language.",
      color: "bg-lavender-100"
    },
    {
      icon: <Heart className="h-6 w-6 text-sage-600" />,
      title: "Personalized Insights",
      description: "Receive customized advice and exercises based on your emotional patterns.",
      color: "bg-sage-100"
    },
    {
      icon: <Shield className="h-6 w-6 text-lavender-600" />,
      title: "Privacy Focused",
      description: "Your emotional data is encrypted and protected with strict privacy controls.",
      color: "bg-lavender-100"
    },
    {
      icon: <Zap className="h-6 w-6 text-sage-600" />,
      title: "24/7 Availability",
      description: "Access your wellness tools whenever you need them, from any device.",
      color: "bg-sage-100"
    },
    {
      icon: <Users className="h-6 w-6 text-lavender-600" />,
      title: "Professional Therapists",
      description: "Connect with licensed therapists for professional support when you need it most.",
      color: "bg-lavender-100"
    }
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Features Designed for Your Wellbeing
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            PureMind AI combines cutting-edge technology with compassionate design to support your mental wellness journey.
          </p>
        </motion.div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
              index={index}
            />
          ))}
        </div>
        
        {/* Therapist Platform Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              For Licensed Mental Health Professionals
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join our platform as a freelance therapist and build your practice with complete flexibility
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Set Your Own Rates</h4>
              <p className="text-gray-600">
                Complete control over your pricing. Keep 85% of session fees with transparent pricing.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Flexible Scheduling</h4>
              <p className="text-gray-600">
                Manage your availability and book sessions on your terms. Work when you want.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">HIPAA Compliant</h4>
              <p className="text-gray-600">
                Secure, encrypted platform with full HIPAA compliance and professional liability coverage.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <a
              href="/become-therapist"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Start Your Application
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <p className="text-sm text-gray-500 mt-2">
              License verification required • Background check included
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;