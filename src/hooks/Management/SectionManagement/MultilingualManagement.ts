/**
 * Multilingual utility functions for sections
 */

import { 
  MultilingualDescription, 
  MultilingualName, 
  SupportedLanguage,
  LanguageInfo
} from "@/src/api/types/hooks/section.types";

// 🎯 ADDED: Missing SUPPORTED_LANGUAGES constant
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl'
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    direction: 'ltr'
  }
};

// 🎯 ADDED: Missing type guard functions
/**
 * Type guard to check if name is multilingual
 */
export function isMultilingualName(name: string | MultilingualName): name is MultilingualName {
  return typeof name === 'object' && name !== null && 
         'en' in name && 'ar' in name && 'tr' in name;
}

/**
 * Type guard to check if description is multilingual
 */
export function isMultilingualDescription(description: string | MultilingualDescription): description is MultilingualDescription {
  return typeof description === 'object' && description !== null && 
         ('en' in description || 'ar' in description || 'tr' in description);
}

/**
 * Get name in specific language with intelligent fallback
 */
export function getMultilingualName(
  item: { name: string | MultilingualName; subName?: string },
  language: SupportedLanguage = 'en'
): string {
  // Handle multilingual names
  if (isMultilingualName(item.name)) {
    // Try requested language first
    if (item.name[language] && item.name[language].trim()) {
      return item.name[language].trim();
    }
    
    // Fallback to English
    if (item.name.en && item.name.en.trim()) {
      return item.name.en.trim();
    }
    
    // Fallback to any available language
    const availableLanguages: SupportedLanguage[] = ['ar', 'tr'];
    for (const lang of availableLanguages) {
      if (item.name[lang] && item.name[lang].trim()) {
        return item.name[lang].trim();
      }
    }
  }
  
  // Handle legacy string names
  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name.trim();
  }
  
  // Final fallback to subName
  return item.subName || 'Unknown Section';
}

/**
 * Get description in specific language with intelligent fallback
 */
export function getMultilingualDescription(
  item: { description?: string | MultilingualDescription },
  language: SupportedLanguage = 'en'
): string {
  if (!item.description) return '';
  
  // Handle multilingual descriptions
  if (isMultilingualDescription(item.description)) {
    // Try requested language first
    if (item.description[language] && item.description[language]?.trim()) {
      return item.description[language]!.trim();
    }
    
    // Fallback to English
    if (item.description.en && item.description.en.trim()) {
      return item.description.en.trim();
    }
    
    // Fallback to any available language
    const availableLanguages: SupportedLanguage[] = ['ar', 'tr'];
    for (const lang of availableLanguages) {
      if (item.description[lang] && item.description[lang]?.trim()) {
        return item.description[lang]!.trim();
      }
    }
  }
  
  // Handle legacy string descriptions
  if (typeof item.description === 'string') {
    return item.description.trim();
  }
  
  return '';
}

/**
 * Check if item has multilingual names
 */
export function hasMultilingualName(item: { name: string | MultilingualName }): boolean {
  return isMultilingualName(item.name) && 
         item.name.en && item.name.ar && item.name.tr &&
         item.name.en.trim() !== '' && 
         item.name.ar.trim() !== '' && 
         item.name.tr.trim() !== '';
}

/**
 * Check if item has multilingual descriptions
 */
export function hasMultilingualDescription(item: { description?: string | MultilingualDescription }): boolean {
  if (!item.description) return false;
  
  return isMultilingualDescription(item.description) &&
         (item.description.en || item.description.ar || item.description.tr);
}

/**
 * Get all available languages for an item
 */
export function getAvailableLanguages(item: { 
  name: string | MultilingualName; 
  description?: string | MultilingualDescription 
}): SupportedLanguage[] {
  const languages: SupportedLanguage[] = [];
  
  // Check name languages
  if (isMultilingualName(item.name)) {
    Object.keys(item.name).forEach(lang => {
      const language = lang as SupportedLanguage;
      if (item.name[language] && item.name[language].trim()) {
        languages.push(language);
      }
    });
  } else if (typeof item.name === 'string' && item.name.trim()) {
    // For legacy names, we assume they're in English
    languages.push('en');
  }
  
  // Remove duplicates and return
  return [...new Set(languages)];
}

/**
 * Validate multilingual name object
 */
export function validateMultilingualName(name: MultilingualName): {
  isValid: boolean;
  errors: Array<{ language: SupportedLanguage; message: string }>;
} {
  const errors: Array<{ language: SupportedLanguage; message: string }> = [];
  
  Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
    const language = lang as SupportedLanguage;
    const value = name[language];
    
    if (!value || !value.trim()) {
      errors.push({
        language,
        message: `Name in ${SUPPORTED_LANGUAGES[language].name} is required`
      });
    } else if (value.trim().length < 2) {
      errors.push({
        language,
        message: `Name in ${SUPPORTED_LANGUAGES[language].name} must be at least 2 characters`
      });
    } else if (value.trim().length > 100) {
      errors.push({
        language,
        message: `Name in ${SUPPORTED_LANGUAGES[language].name} must be less than 100 characters`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate multilingual description object
 */
export function validateMultilingualDescription(description: MultilingualDescription): {
  isValid: boolean;
  errors: Array<{ language: SupportedLanguage; message: string }>;
} {
  const errors: Array<{ language: SupportedLanguage; message: string }> = [];
  
  Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
    const language = lang as SupportedLanguage;
    const value = description[language];
    
    if (value && value.trim().length > 500) {
      errors.push({
        language,
        message: `Description in ${SUPPORTED_LANGUAGES[language].name} must be less than 500 characters`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create empty multilingual name object
 */
export function createEmptyMultilingualName(): MultilingualName {
  return {
    en: '',
    ar: '',
    tr: ''
  };
}

/**
 * Create empty multilingual description object
 */
export function createEmptyMultilingualDescription(): MultilingualDescription {
  return {
    en: '',
    ar: '',
    tr: ''
  };
}

/**
 * Convert legacy string name to multilingual object
 */
export function convertLegacyNameToMultilingual(name: string): MultilingualName {
  const trimmedName = name.trim();
  return {
    en: trimmedName,
    ar: trimmedName,
    tr: trimmedName
  };
}

/**
 * Convert legacy string description to multilingual object
 */
export function convertLegacyDescriptionToMultilingual(description: string): MultilingualDescription {
  const trimmedDescription = description.trim();
  return {
    en: trimmedDescription,
    ar: trimmedDescription,
    tr: trimmedDescription
  };
}

/**
 * Get language info for a specific language code
 */
export function getLanguageInfo(language: SupportedLanguage): LanguageInfo {
  return SUPPORTED_LANGUAGES[language];
}

/**
 * Get text direction for a language
 */
export function getTextDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
  return SUPPORTED_LANGUAGES[language].direction;
}

/**
 * Check if a language is RTL
 */
export function isRTLLanguage(language: SupportedLanguage): boolean {
  return SUPPORTED_LANGUAGES[language].direction === 'rtl';
}

/**
 * Format multilingual name for display
 */
export function formatMultilingualNameForDisplay(
  name: string | MultilingualName,
  language: SupportedLanguage,
  showLanguageIndicator: boolean = false
): string {
  const displayName = getMultilingualName({ name }, language);
  
  if (showLanguageIndicator && isMultilingualName(name)) {
    const langInfo = getLanguageInfo(language);
    return `${langInfo.flag} ${displayName}`;
  }
  
  return displayName;
}

/**
 * Generate language summary for multilingual item
 */
export function generateLanguageSummary(item: { 
  name: string | MultilingualName; 
  description?: string | MultilingualDescription 
}): {
  hasMultilingualName: boolean;
  hasMultilingualDescription: boolean;
  availableLanguages: SupportedLanguage[];
  completionStatus: Record<SupportedLanguage, { name: boolean; description: boolean }>;
} {
  const availableLanguages = getAvailableLanguages(item);
  const hasMultiName = hasMultilingualName(item);
  const hasMultiDesc = hasMultilingualDescription(item);
  
  const completionStatus: Record<SupportedLanguage, { name: boolean; description: boolean }> = {
    en: { name: false, description: false },
    ar: { name: false, description: false },
    tr: { name: false, description: false }
  };
  
  // Check name completion
  if (isMultilingualName(item.name)) {
    Object.keys(completionStatus).forEach(lang => {
      const language = lang as SupportedLanguage;
      completionStatus[language].name = !!(item.name[language] && item.name[language].trim());
    });
  } else if (typeof item.name === 'string' && item.name.trim()) {
    completionStatus.en.name = true;
  }
  
  // Check description completion
  if (item.description && isMultilingualDescription(item.description)) {
    Object.keys(completionStatus).forEach(lang => {
      const language = lang as SupportedLanguage;
      completionStatus[language].description = !!(item.description![language] && item.description![language]?.trim());
    });
  } else if (typeof item.description === 'string' && item.description.trim()) {
    completionStatus.en.description = true;
  }
  
  return {
    hasMultilingualName: hasMultiName,
    hasMultilingualDescription: hasMultiDesc,
    availableLanguages,
    completionStatus
  };
}

/**
 * Sanitize multilingual input
 */
export function sanitizeMultilingualName(name: MultilingualName): MultilingualName {
  return {
    en: name.en?.trim() || '',
    ar: name.ar?.trim() || '',
    tr: name.tr?.trim() || ''
  };
}

/**
 * Sanitize multilingual description input
 */
export function sanitizeMultilingualDescription(description: MultilingualDescription): MultilingualDescription {
  return {
    en: description.en?.trim() || '',
    ar: description.ar?.trim() || '',
    tr: description.tr?.trim() || ''
  };
}

/**
 * Check if two multilingual names are equal
 */
export function areMultilingualNamesEqual(name1: MultilingualName, name2: MultilingualName): boolean {
  return name1.en.trim() === name2.en.trim() &&
         name1.ar.trim() === name2.ar.trim() &&
         name1.tr.trim() === name2.tr.trim();
}

/**
 * Check if multilingual name is complete (has all languages)
 */
export function isMultilingualNameComplete(name: MultilingualName): boolean {
  return !!(name.en?.trim() && name.ar?.trim() && name.tr?.trim());
}

/**
 * Get missing languages for a multilingual name
 */
export function getMissingLanguages(name: MultilingualName): SupportedLanguage[] {
  const missing: SupportedLanguage[] = [];
  
  if (!name.en?.trim()) missing.push('en');
  if (!name.ar?.trim()) missing.push('ar');
  if (!name.tr?.trim()) missing.push('tr');
  
  return missing;
}

// Export all utility functions as a bundle
export const multilingualUtils = {
  getMultilingualName,
  getMultilingualDescription,
  hasMultilingualName,
  hasMultilingualDescription,
  getAvailableLanguages,
  validateMultilingualName,
  validateMultilingualDescription,
  createEmptyMultilingualName,
  createEmptyMultilingualDescription,
  convertLegacyNameToMultilingual,
  convertLegacyDescriptionToMultilingual,
  getLanguageInfo,
  getTextDirection,
  isRTLLanguage,
  formatMultilingualNameForDisplay,
  generateLanguageSummary,
  sanitizeMultilingualName,
  sanitizeMultilingualDescription,
  areMultilingualNamesEqual,
  isMultilingualNameComplete,
  getMissingLanguages,
  isMultilingualName,
  isMultilingualDescription,
  SUPPORTED_LANGUAGES
};