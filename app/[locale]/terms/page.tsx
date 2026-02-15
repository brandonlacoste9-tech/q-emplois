import {useTranslations} from 'next-intl';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function TermsPage() {
  const t = useTranslations('terms');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">{t('title')}</h1>
            <p className="text-gray-600 mb-8">
              {t('lastUpdated', {date: new Date().toLocaleDateString()})}
            </p>
            
            <div className="prose max-w-none">
              <p className="text-lg mb-6 text-gray-700">{t('intro')}</p>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.service.title')}
                </h2>
                <p className="text-gray-700">{t('sections.service.content')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.obligations.title')}
                </h2>
                <p className="text-gray-700">{t('sections.obligations.content')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.payment.title')}
                </h2>
                <p className="text-gray-700">{t('sections.payment.content')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.liability.title')}
                </h2>
                <p className="text-gray-700">{t('sections.liability.content')}</p>
              </section>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                <h3 className="font-bold text-gray-800 mb-2">
                  Conformité à la Charte de la langue française (Loi 96) / 
                  Charter of the French Language Compliance (Bill 96)
                </h3>
                <p className="text-gray-700">
                  Ces conditions d'utilisation sont disponibles en français et en anglais 
                  conformément à la Loi 96. / These terms of use are available in French 
                  and English in accordance with Bill 96.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
