'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next, { updateI18nLanguage, getStoredLanguage } from '../lib/i18n';

interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (language: 'en' | 'ar') => void;
  textDirection: 'ltr' | 'rtl';
  setTextDirection: (textDirection: 'ltr' | 'rtl') => void;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default state that works on server
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle initial load from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = getStoredLanguage() as 'en' | 'ar';
      setLanguage(storedLanguage);
      setTextDirection(storedLanguage === 'ar' ? 'rtl' : 'ltr');
      updateI18nLanguage(storedLanguage);
      setIsLoaded(true);
    }
  }, []);

  // Update localStorage whenever language changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      localStorage.setItem('language', language);
      setTextDirection(language === 'ar' ? 'rtl' : 'ltr');
      updateI18nLanguage(language);
      
      // Update document direction
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, isLoaded]);

  const handleSetLanguage = (newLanguage: 'en' | 'ar') => {
    setLanguage(newLanguage);
  };

  return (
    <I18nextProvider i18n={i18next}>
      <LanguageContext.Provider value={{ 
        language, 
        setLanguage: handleSetLanguage, 
        textDirection, 
        setTextDirection,
        isLoaded 
      }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};