import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const hasConsented = localStorage.getItem('qworks-cookie-consent');
    if (!hasConsented) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);
  
  const handleAccept = () => {
    localStorage.setItem('qworks-cookie-consent', 'accepted');
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-or-couture shadow-2xl z-50 p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-cuir-bleu-fonce" />
            <h3 className="text-lg font-bold text-cuir-bleu-profond">Respect de votre vie privée</h3>
          </div>
          <p className="text-texte-secondaire text-sm">
            Nous utilisons des cookies pour améliorer votre expérience. 
            En continuant, vous acceptez notre utilisation des cookies.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-or-couture text-cuir-bleu-profond rounded-lg font-semibold"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
