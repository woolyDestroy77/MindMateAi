import React from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Mic, BarChart2, Globe, Heart, Shield, Zap } from 'lucide-react';
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
      icon: <MessageSquare className="h-6 w-6 text-sage-600" />,
      title: "AI Copilot Chat",
      description: "Have therapy-like conversations with our GPT-powered AI that adapts to your needs.",
      color: "bg-sage-100"
    },
    {
      icon: <Mic className="h-6 w-6 text-lavender-600" />,
      title: "Voice Responses",
      description: "Receive voice feedback with appropriate emotional tones using ElevenLabs technology.",
      color: "bg-lavender-100"
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-sage-600" />,
      title: "Mood Journal & Tracking",
      description: "Document your emotional journey and visualize progress over time.",
      color: "bg-sage-100"
    },
    {
      icon: <Globe className="h-6 w-6 text-lavender-600" />,
      title: "Multilingual Support",
      description: "Access emotional support in your preferred language through Lingo integration.",
      color: "bg-lavender-100"
    },
    {
      icon: <Heart className="h-6 w-6 text-sage-600" />,
      title: "Personalized Care",
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
      description: "Access support whenever you need it, day or night, from any device.",
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
            MindMate AI combines cutting-edge technology with compassionate design to support your mental wellness journey.
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