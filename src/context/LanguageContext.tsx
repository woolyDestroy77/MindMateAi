import React, { createContext, useContext, ReactNode } from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface LanguageContextType {
  currentLanguage: string;
  isLoading: boolean;
  error: string | null;
  supportedLanguages: { code: string; name: string; flag: string }[];
  changeLanguage: (languageCode: string) => void;
  translate: (text: string, options?: any) => string;
  getLanguageDetails: (code: string) => { code: string; name: string; flag: string };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const languageService = useLanguage();

  return (
    <LanguageContext.Provider value={languageService}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};