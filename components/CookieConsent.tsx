'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';

export default function CookieConsent() {
  const t = useTranslations('consent');
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm flex-1">
          {t('message')}
        </p>
        <div className="flex gap-2">
          <a
            href="#"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            {t('learnMore')}
          </a>
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            {t('decline')}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
