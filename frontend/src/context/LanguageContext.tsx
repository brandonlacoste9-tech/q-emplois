import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  fr: {
    'nav.services': 'Services',
    'nav.how_it_works': 'Comment ça marche',
    'nav.testimonials': 'Témoignages',
    'nav.become_provider': 'Devenir artisan',
    'hero.title': "Trouve l'artisan",
    'hero.subtitle': "qu'il te faut",
  },
  en: {
    'nav.services': 'Services',
    'nav.how_it_works': 'How It Works',
    'nav.testimonials': 'Testimonials',
    'nav.become_provider': 'Become a Provider',
    'hero.title': 'Find the tradesperson',
    'hero.subtitle': 'you need',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  
  useEffect(() => {
    const saved = localStorage.getItem('qworks-language') as Language;
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('qworks-language', lang);
    document.documentElement.lang = lang;
  };
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.fr] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
