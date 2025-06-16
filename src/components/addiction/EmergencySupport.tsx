import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageSquare, Globe, AlertTriangle, Heart, Users, Shield } from 'lucide-react';
import Button from '../ui/Button';

interface EmergencySupportProps {
  isOpen: boolean;
  onClose: () => void;
  resources: {
    crisis: {
      phone: string;
      text: string;
      chat: string;
    };
    substance: {
      phone: string;
      website: string;
    };
    gambling: {
      phone: string;
      website: string;
    };
  };
}

const EmergencySupport: React.FC<EmergencySupportProps> = ({ isOpen, onClose, resources }) => {
  const emergencyContacts = [
    {
      title: 'Crisis & Suicide Prevention',
      description: 'Immediate help for mental health emergencies',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      contacts: [
        { type: 'phone', label: 'Call 988', value: resources.crisis.phone, action: `tel:${resources.crisis.phone}` },
        { type: 'text', label: 'Text HOME to 741741', value: resources.crisis.text, action: 'sms:741741?body=HOME' },
        { type: 'web', label: 'Online Chat', value: resources.crisis.chat, action: `https://${resources.crisis.chat}` }
      ]
    },
    {
      title: 'Substance Abuse Support',
      description: '24/7 confidential treatment referral service',
      icon: Heart,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      contacts: [
        { type: 'phone', label: 'SAMHSA Helpline', value: resources.substance.phone, action: `tel:${resources.substance.phone.replace(/\D/g, '')}` },
        { type: 'web', label: 'Find Treatment', value: resources.substance.website, action: `https://${resources.substance.website}` }
      ]
    },
    {
      title: 'Gambling Addiction',
      description: 'National problem gambling helpline',
      icon: Shield,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      contacts: [
        { type: 'phone', label: 'Gambling Helpline', value: resources.gambling.phone, action: `tel:${resources.gambling.phone.replace(/\D/g, '')}` },
        { type: 'web', label: 'Resources', value: resources.gambling.website, action: `https://${resources.gambling.website}` }
      ]
    }
  ];

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone size={16} />;
      case 'text': return <MessageSquare size={16} />;
      case 'web': return <Globe size={16} />;
      default: return <Phone size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Emergency Support</h2>
                    <p className="text-sm text-gray-600">Help is available 24/7 - you're not alone</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Emergency Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">If you're in immediate danger:</h3>
                    <p className="text-sm text-red-800 mb-2">
                      Call 911 (US) or your local emergency services immediately.
                    </p>
                    <p className="text-xs text-red-700">
                      If you're having thoughts of suicide or self-harm, please reach out for help right now.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Resources */}
              <div className="space-y-6">
                {emergencyContacts.map((resource, index) => (
                  <motion.div
                    key={resource.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${resource.color}`}
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <resource.icon className={`w-5 h-5 ${resource.iconColor} flex-shrink-0 mt-0.5`} />
                      <div>
                        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {resource.contacts.map((contact, contactIndex) => (
                        <a
                          key={contactIndex}
                          href={contact.action}
                          target={contact.type === 'web' ? '_blank' : undefined}
                          rel={contact.type === 'web' ? 'noopener noreferrer' : undefined}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          <div className={`p-2 rounded-lg ${resource.color}`}>
                            {getContactIcon(contact.type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{contact.label}</div>
                            <div className="text-sm text-gray-600">{contact.value}</div>
                          </div>
                          <div className="text-gray-400">
                            →
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Additional Resources */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Support Groups & Communities</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Alcoholics Anonymous:</strong> <a href="https://www.aa.org" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">aa.org</a>
                      </div>
                      <div>
                        <strong>Narcotics Anonymous:</strong> <a href="https://www.na.org" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">na.org</a>
                      </div>
                      <div>
                        <strong>SMART Recovery:</strong> <a href="https://www.smartrecovery.org" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">smartrecovery.org</a>
                      </div>
                      <div>
                        <strong>Gamblers Anonymous:</strong> <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">gamblersanonymous.org</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Encouragement */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">You Are Not Alone</h3>
                    <p className="text-sm text-green-800">
                      Reaching out for help is a sign of strength, not weakness. Recovery is possible, 
                      and there are people who care about you and want to help. Take it one day at a time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
                leftIcon={<X size={18} />}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencySupport;
