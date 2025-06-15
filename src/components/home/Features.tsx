import React from 'react';
import { motion } from 'framer-motion';
import { Brain, PenTool, Mic, BarChart2, Globe, Heart, Shield, Zap } from 'lucide-react';
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
      </div>
    </section>
  );
};

export default Features;