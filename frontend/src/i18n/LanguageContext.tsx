import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, LanguageCode } from './translations';

export type AppLanguage = LanguageCode | 'English' | 'मराठी' | 'हिंदी' | 'Marathi' | 'Hindi';

interface LanguageContextType {
  language: LanguageCode;
  langCode: LanguageCode;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'cottoncare_language_pref';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [langCode, setLangCode] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'mr' || saved === 'Marathi' || saved === 'मराठी') return 'mr';
      if (saved === 'hi' || saved === 'Hindi' || saved === 'हिंदी') return 'hi';
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: AppLanguage) => {
    let code: LanguageCode = 'en';
    if (lang === 'मराठी' || lang === 'Marathi' || lang === 'mr') code = 'mr';
    else if (lang === 'हिंदी' || lang === 'Hindi' || lang === 'hi') code = 'hi';
    setLangCode(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      console.warn('Could not persist language to localStorage:', e);
    }
  };

  const t = (key: string, defaultValue?: string): string => {
    const dict = translations[langCode];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English
    const enDict = translations.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return defaultValue !== undefined ? defaultValue : key;
  };

  return (
    <LanguageContext.Provider value={{ language: langCode, langCode, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
