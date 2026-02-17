import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  
  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
        bg-white/10 hover:bg-white/20 text-white/90 hover:text-white
        border border-white/20 hover:border-or-couture/50"
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">{t('language.switch')}</span>
      <span className="sm:hidden">{language === 'fr' ? 'EN' : 'FR'}</span>
    </button>
  );
}
