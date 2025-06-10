// src/lib/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEnglish from '../locales/English/translation.json';
import translationArabic from '../locales/Arabic/translation.json';
import translationTurkish from '../locales/Turkish/translation.json';

const resources = {
  en: {
    translation: translationEnglish,
  },
  ar: {
    translation: translationArabic,
  },
  tr : {
        translation: translationTurkish,
  }
};

// Initialize i18next WITHOUT accessing localStorage during module load
const initI18n = async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      resources,
      lng: 'en', // Default language for SSR
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false, // Disable suspense for SSR
      },
    });
  }
};

// Function to update language (call this from your LanguageContext)
export const updateI18nLanguage = (language: string) => {
  if (typeof window !== 'undefined' && i18next.isInitialized) {
    i18next.changeLanguage(language);
  }
};

// Function to get stored language safely
export const getStoredLanguage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en';
  }
  return 'en';
};

// Initialize i18n
initI18n();

export default i18next;