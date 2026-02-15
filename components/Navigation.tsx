'use client';

import {useTranslations, useLocale} from 'next-intl';
import {useRouter, usePathname} from 'next/navigation';

export default function Navigation() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(path);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">QWORKS</h1>
            <div className="hidden md:flex space-x-6">
              <a href={`/${locale}`} className="hover:text-blue-200 transition">
                {t('home')}
              </a>
              <a href={`/${locale}/tasks`} className="hover:text-blue-200 transition">
                {t('tasks')}
              </a>
              <a href={`/${locale}/workers`} className="hover:text-blue-200 transition">
                {t('workers')}
              </a>
              <a href={`/${locale}/about`} className="hover:text-blue-200 transition">
                {t('about')}
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={switchLocale}
              className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800 transition text-sm"
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50 transition">
              {t('login')}
            </button>
            <button className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800 transition">
              {t('signup')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
