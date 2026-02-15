import {useTranslations} from 'next-intl';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">{t('title')}</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">{t('subtitle')}</p>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              {t('description')}
            </p>
            <div className="flex gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                {t('cta.findWorker')}
              </button>
              <button className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition">
                {t('cta.becomeWorker')}
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              {t('features.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-blue-50 p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🇫🇷</div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('features.french.title')}
                </h3>
                <p className="text-gray-600">
                  {t('features.french.description')}
                </p>
              </div>
              <div className="bg-blue-50 p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('features.privacy.title')}
                </h3>
                <p className="text-gray-600">
                  {t('features.privacy.description')}
                </p>
              </div>
              <div className="bg-blue-50 p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('features.local.title')}
                </h3>
                <p className="text-gray-600">
                  {t('features.local.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              {t('howItWorks.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600">
                  {t('howItWorks.step1.description')}
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('howItWorks.step2.title')}
                </h3>
                <p className="text-gray-600">
                  {t('howItWorks.step2.description')}
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {t('howItWorks.step3.title')}
                </h3>
                <p className="text-gray-600">
                  {t('howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}
