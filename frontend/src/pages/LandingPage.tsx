import { HardHat, Briefcase, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-quebec-light text-quebec-dark">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-16 h-16 bg-quebec-blue rounded-2xl flex items-center justify-center">
                <HardHat className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-quebec-blue">
                Q-Emplois
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              La plateforme québécoise qui connecte les artisans aux clients.
              Plomberie, électricité, menuiserie et plus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Devenir artisan
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Button>
              </a>
              <a href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Connexion
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-quebec-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trouvez des mandats</h3>
              <p className="text-gray-600">
                Recevez des demandes de clients près de chez vous.
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-quebec-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sécurisé et fiable</h3>
              <p className="text-gray-600">
                Paiements sécurisés et profils vérifiés.
              </p>
            </div>
            <div className="text-center">
              <HardHat className="w-12 h-12 text-quebec-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pour tous les métiers</h3>
              <p className="text-gray-600">
                Plomberie, électricité, peinture, rénovation et plus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-quebec-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer?</h2>
          <p className="text-xl opacity-90 mb-8">
            Inscrivez-vous en quelques minutes et recevez vos premiers mandats.
          </p>
          <a href="/register">
            <Button size="lg" variant="secondary" className="bg-white text-quebec-blue hover:bg-gray-100">
              Créer un compte
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Q-Emplois. Tous droits réservés.
      </footer>
    </div>
  );
}
