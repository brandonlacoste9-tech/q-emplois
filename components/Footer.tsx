'use client';

import {useTranslations} from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">QWORKS</h3>
            <p className="text-gray-400 mb-4">
              {t('languageDisclaimer')}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t('company')}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">{t('about')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">{t('careers')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">{t('contact')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">{t('privacy')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">{t('terms')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">{t('bill96')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">{t('law25')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
