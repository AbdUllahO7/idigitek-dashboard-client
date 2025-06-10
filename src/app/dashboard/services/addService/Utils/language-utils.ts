
import { Language } from "@/src/api/types/hooks/language.types";

// /**
//  * Creates a mapping of language IDs to language codes
//  * 
//  * @param activeLanguages - Array of language objects
//  * @returns A record mapping language IDs to language codes
//  */
export const createLanguageCodeMap = (activeLanguages: Language[]): Record<string, string> => {
  return activeLanguages.reduce<Record<string, string>>((acc, lang) => {
    acc[lang._id] = lang.languageID;
    return acc;
  }, {});
};

