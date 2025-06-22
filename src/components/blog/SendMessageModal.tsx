import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import Button from '../ui/Button';
import { useBlogSocial } from '../../hooks/useBlogSocial';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendMessage } = useBlogSocial();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting || !recipientId || recipientId.trim() === '') return;
    
    setIsSubmitting(true);
    try {
      const sent = await sendMessage(recipientId, message.trim());
      if (sent) {
        setMessage('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100">
                    {recipientAvatar ? (
                      <img 
                        src={recipientAvatar} 
                        alt={recipientName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200";
                        }}
                      />
                    ) : (
                      <User className="w-full h-full p-2 text-lavender-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Message to {recipientName}</h3>
                    <p className="text-xs text-gray-500">Direct messages are private</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Write your message to ${recipientName}...`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                  rows={5}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!message.trim() || isSubmitting || !recipientId || recipientId.trim() === ''}
                  leftIcon={<Send size={16} />}
                >
                  Send Message
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SendMessageModal;