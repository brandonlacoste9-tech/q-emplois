import {useTranslations} from 'next-intl';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

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
                  {t('sections.collection.title')}
                </h2>
                <p className="text-gray-700">{t('sections.collection.content')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.usage.title')}
                </h2>
                <p className="text-gray-700">{t('sections.usage.content')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.protection.title')}
                </h2>
                <p className="text-gray-700">{t('sections.protection.content')}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t('sections.rights.title')}
                </h2>
                <p className="text-gray-700">{t('sections.rights.content')}</p>
              </section>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                <h3 className="font-bold text-gray-800 mb-2">
                  Conformité à la Loi 25 / Law 25 Compliance
                </h3>
                <p className="text-gray-700">
                  Cette politique de confidentialité est conforme à la Loi modernisant des 
                  dispositions législatives en matière de protection des renseignements 
                  personnels (Loi 25) du Québec. / This privacy policy complies with Quebec's 
                  Law to modernize legislative provisions as regards the protection of personal 
                  information (Law 25).
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
