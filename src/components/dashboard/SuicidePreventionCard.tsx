import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, MessageSquare, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface SuicidePreventionCardProps {
  className?: string;
}

const SuicidePreventionCard: React.FC<SuicidePreventionCardProps> = ({ className = '' }) => {
  const [suicideCount, setSuicideCount] = useState<number>(0);
  const [currentQuote, setCurrentQuote] = useState<string>('');

  // Suicide prevention quotes
  const preventionQuotes = [
    "Your life matters. Your story isn't over yet. There are people who care about you and want to help.",
    "Tomorrow needs you. The world needs your unique gifts, your perspective, your light.",
    "You are stronger than you know. This pain is temporary, but your life has permanent value.",
    "Reaching out for help is a sign of courage, not weakness. You deserve support and care.",
    "Every day you choose to stay is a victory. You are braver than you believe.",
    "Your feelings are valid, but they don't define your worth. You matter more than you know.",
    "There is hope, even when your brain tells you there isn't. Hold on for one more day.",
    "You have survived 100% of your worst days so far. You can get through this too.",
    "The world is a better place with you in it. Your presence makes a difference.",
    "Crisis is temporary. Suicide is permanent. Choose the temporary struggle over permanent silence.",
    "You are loved, even when you don't feel it. You are valued, even when you doubt it.",
    "Your pain is real, but so is your strength. You have the power to overcome this moment.",
    "Every sunrise is a new chance. Every breath is a new opportunity to heal and grow.",
    "You are not alone in this fight. There are people trained to help you through this darkness.",
    "Your life has meaning and purpose, even if you can't see it right now. Keep going."
  ];

  // Estimated global suicide statistics (approximate numbers for awareness)
  // Note: These are estimates based on WHO data for educational/awareness purposes
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    // WHO estimates approximately 700,000+ suicides globally per year
    // This translates to roughly 1,918 per day globally
    const estimatedDailyGlobal = 1918;
    const estimatedYearToDate = Math.floor(daysPassed * estimatedDailyGlobal);
    
    setSuicideCount(estimatedYearToDate);

    // Select a random quote
    const randomQuote = preventionQuotes[Math.floor(Math.random() * preventionQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const emergencyContacts = [
    {
      name: 'Crisis Lifeline',
      number: '988',
      description: 'US Suicide & Crisis Lifeline',
      action: 'tel:988'
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free 24/7 crisis support',
      action: 'sms:741741?body=HOME'
    },
    {
      name: 'International',
      number: 'findahelpline.com',
      description: 'Global crisis helplines',
      action: 'https://findahelpline.com'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 border-red-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Heart className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Suicide Prevention Awareness</h3>
            </div>
            <div className="bg-white/60 rounded-lg p-4 border border-red-200">
              <div className="text-3xl font-bold text-red-800 mb-1">
                {formatNumber(suicideCount)}
              </div>
              <div className="text-sm text-red-700">
                Estimated global suicides in {new Date().getFullYear()}
              </div>
              <div className="text-xs text-red-600 mt-1 italic">
                Source: WHO Global Health Observatory data
              </div>
            </div>
          </div>

          {/* Prevention Quote */}
          <div className="bg-white/70 rounded-lg p-4 border border-pink-200">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-pink-900 mb-2">Message of Hope</h4>
                <p className="text-sm text-pink-800 leading-relaxed italic">
                  "{currentQuote}"
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <h4 className="font-medium text-red-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Need Help Right Now?
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={contact.action}
                  target={contact.action.startsWith('http') ? '_blank' : undefined}
                  rel={contact.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-red-200 hover:bg-white hover:border-red-300 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    {contact.name === 'Crisis Lifeline' && <Phone className="w-4 h-4 text-red-600" />}
                    {contact.name === 'Crisis Text Line' && <MessageSquare className="w-4 h-4 text-red-600" />}
                    {contact.name === 'International' && <ExternalLink className="w-4 h-4 text-red-600" />}
                    <div>
                      <div className="font-medium text-red-900 text-sm">{contact.name}</div>
                      <div className="text-xs text-red-700">{contact.description}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-red-800 group-hover:text-red-900">
                    {contact.number}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-lg p-4 border border-red-200">
            <div className="text-center">
              <h4 className="font-semibold text-red-900 mb-2">You Are Not Alone</h4>
              <p className="text-sm text-red-800 mb-3">
                If you or someone you know is struggling with suicidal thoughts, 
                please reach out for help immediately. Every life matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="tel:988"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call 988 Now
                </a>
                <a
                  href="https://suicidepreventionlifeline.org/chat/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Online Chat
                </a>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="text-center">
            <p className="text-xs text-red-600 mb-2">
              <strong>Remember:</strong> Mental health struggles are treatable. Recovery is possible.
            </p>
            <div className="flex justify-center space-x-4 text-xs">
              <a
                href="https://www.nami.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-700 hover:text-red-800 underline"
              >
                NAMI.org
              </a>
              <a
                href="https://www.mentalhealth.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-700 hover:text-red-800 underline"
              >
                MentalHealth.gov
              </a>
              <a
                href="https://www.samhsa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-700 hover:text-red-800 underline"
              >
                SAMHSA.gov
              </a>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SuicidePreventionCard;