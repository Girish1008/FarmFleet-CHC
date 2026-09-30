import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, TranslationKey } from './en.js';
import { hi } from './hi.js';
import { ta } from './ta.js';

export type Language = 'en' | 'hi' | 'ta';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, defaultText?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en,
  hi,
  ta,
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('farmfleet_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('farmfleet_lang', lang);
  };

  const t = (key: TranslationKey, defaultText?: string): string => {
    const dictionary = dictionaries[language] || en;
    return dictionary[key] || defaultText || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
