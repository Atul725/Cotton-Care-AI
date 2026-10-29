import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, translations } from './translations';

interface LanguageContextProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'mr',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

// In-memory module cache to ensure persistence across hot reloads and screen navigations
let currentLang: SupportedLanguage = 'mr';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<SupportedLanguage>(currentLang);

  const setLanguage = (lang: SupportedLanguage) => {
    currentLang = lang;
    setLangState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => useContext(LanguageContext);
