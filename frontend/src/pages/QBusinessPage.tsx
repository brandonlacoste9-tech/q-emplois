import { useState } from 'react';
import { Link } from 'react-router-dom';

export function QBusinessPage() {
    const [lang, setLang] = useState<'fr' | 'en'>('fr');

    return (
        <div className="min-h-screen bg-[#1a0f0a] text-[#f4ece0]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 border-b border-[#5a3a28] bg-[#2b1a10]">
                <Link to="/" className="text-[#E0A96D] text-2xl font-bold tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                    Q-MÉTIER
                </Link>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="text-[#E0A96D] text-sm font-bold opacity-80 hover:opacity-100">
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>
                    <button className="px-4 py-2 border border-[#E0A96D] text-[#E0A96D] rounded text-sm hover:bg-[#E0A96D] hover:text-[#1a0f0a] transition-all">
                        {lang === 'fr' ? 'Connexion' : 'Login'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="py-20 px-6 max-w-5xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#F2D4B6" }}>
                    {lang === 'fr' ? "L'Élite des Métiers du Québec" : "The Elite Trades of Quebec"}
                </h1>
                <p className="text-lg md:text-xl text-[#D1B295] mb-12 max-w-3xl mx-auto leading-relaxed">
                    {lang === 'fr'
                        ? "Accès exclusif aux meilleurs entrepreneurs vérifiés RBQ. Plomberie, électricité, et construction de prestige gérés par intelligence artificielle souveraine."
                        : "Exclusive access to the best RBQ-verified contractors. Plumbing, electrical, and prestige construction managed by sovereign AI."}
                </p>

                <div className="flex justify-center gap-6 flex-wrap">
                    <button className="px-8 py-4 bg-gradient-to-r from-[#B66D38] to-[#8A4A25] text-white font-bold rounded shadow-lg border border-[#E0A96D] hover:scale-105 transition-transform">
                        {lang === 'fr' ? "Soumettre un projet VIP" : "Submit VIP Project"}
                    </button>
                    <button className="px-8 py-4 bg-transparent border-2 border-[#5a3a28] text-[#E0A96D] font-bold rounded hover:border-[#E0A96D] transition-colors">
                        {lang === 'fr' ? "Rejoindre l'Élite (RBQ)" : "Join the Elite (RBQ)"}
                    </button>
                </div>
            </div>

            {/* verification banner */}
            <div className="bg-[#2b1a10] border-y border-[#5a3a28] py-12">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="imperial-leather-box p-8">
                        <h3 className="text-[#E0A96D] font-bold text-xl mb-3" style={{ fontFamily: "'Cinzel', serif" }}>Validation RBQ</h3>
                        <p className="text-[#D1B295] text-sm">Vérification en temps réel des licences et assurances.</p>
                    </div>
                    <div className="imperial-leather-box p-8">
                        <h3 className="text-[#E0A96D] font-bold text-xl mb-3" style={{ fontFamily: "'Cinzel', serif" }}>Contrats Garantis</h3>
                        <p className="text-[#D1B295] text-sm">Paiements sécurisés par L'Atelier avec libération sur jalon.</p>
                    </div>
                    <div className="imperial-leather-box p-8">
                        <h3 className="text-[#E0A96D] font-bold text-xl mb-3" style={{ fontFamily: "'Cinzel', serif" }}>IA Souveraine</h3>
                        <p className="text-[#D1B295] text-sm">Vos données et historiques de chantiers restent au Québec.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
