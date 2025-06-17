import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../hooks/useLanguage';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'modal';
  size?: 'sm' | 'md' | 'lg';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'dropdown',
  size = 'md'
}) => {
  const { currentLanguage, changeLanguage, translate } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${sizeClasses[size]}`}
          aria-expanded={isOpen}
        >
          <Globe size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
          <span>{currentLang.flag}</span>
          <span className="hidden md:inline">{currentLang.name}</span>
          <ChevronDown size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    currentLanguage === language.code ? 'bg-lavender-50 text-lavender-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                  {currentLanguage === language.code && (
                    <Check size={16} className="text-lavender-600" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Modal variant (for mobile or full-screen language selection)
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${sizeClasses[size]}`}
      >
        <Globe size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        <span>{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {translate('Select Language')}
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language.code)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                        currentLanguage === language.code
                          ? 'border-lavender-500 bg-lavender-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl">{language.flag}</div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{language.name}</div>
                        <div className="text-xs text-gray-500">{language.code.toUpperCase()}</div>
                      </div>
                      {currentLanguage === language.code && (
                        <Check size={18} className="text-lavender-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LanguageSelector;