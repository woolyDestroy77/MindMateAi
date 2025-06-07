import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { FaqItem } from '../../types';

const faqs: FaqItem[] = [
  {
    question: "How does MindMate AI detect emotions?",
    answer: "MindMate AI uses natural language processing and voice analysis to detect emotions from your text and voice inputs. The system analyzes patterns, tone, word choice, and voice characteristics to determine your emotional state.",
    category: "technical"
  },
  {
    question: "Is MindMate AI a replacement for therapy?",
    answer: "No, MindMate AI is not a replacement for professional therapy or medical advice. It's designed as a supportive tool to complement professional care, provide emotional support, and help with daily mental wellness practices.",
    category: "general"
  },
  {
    question: "How is my personal data protected?",
    answer: "Your privacy is our priority. All conversations are encrypted, and we follow strict data protection protocols. You can delete your data at any time, and we never share your personal information with third parties without your explicit consent.",
    category: "privacy"
  },
  {
    question: "Can I use MindMate AI in my native language?",
    answer: "Yes! MindMate AI supports multiple languages through our integration with Lingo. The emotion detection and responses are calibrated to work effectively across different languages and cultural expressions of emotion.",
    category: "general"
  },
  {
    question: "What should I do in a mental health emergency?",
    answer: "MindMate AI is not designed for emergencies. If you're experiencing a crisis or having thoughts of harming yourself or others, please contact emergency services (911 in the US), call a crisis helpline like the 988 Suicide & Crisis Lifeline, or go to your nearest emergency room.",
    category: "support"
  },
  {
    question: "How accurate is the emotion detection?",
    answer: "Our emotion detection technology has been trained on diverse datasets and continues to improve over time. While it's highly accurate for most users, individual variations in expressing emotions may affect results. The system learns from your interactions to improve personalization.",
    category: "technical"
  },
];

const FAQItem: React.FC<{ faq: FaqItem }> = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-b border-gray-200"
    >
      <motion.button
        className="flex justify-between items-center w-full py-6 text-left"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="text-lg font-medium text-gray-900">{faq.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="ml-6 flex-shrink-0"
        >
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-lavender-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-6">
              <p className="text-base text-gray-600">{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ: React.FC = () => {
  return (
    <section id="faq" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Find answers to common questions about MindMate AI and mental wellness support.
          </p>
        </motion.div>
        
        <div className="mt-12 max-w-3xl mx-auto">
          <dl>
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} />
            ))}
          </dl>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-base text-gray-600">
            Have more questions? <a href="#" className="text-lavender-600 font-medium hover:text-lavender-700">Contact our support team</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;