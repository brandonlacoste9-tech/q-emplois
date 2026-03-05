import { useState } from 'react';
import { Link } from 'react-router-dom';

export function QBusinessPage() {
    const [lang, setLang] = useState<'fr' | 'en'>('fr');

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#1a0f0a", color: "#f4ece0", fontFamily: "'Inter', sans-serif" }}>
            {/* Navbar */}
            <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid #5a3a28", backgroundColor: "#2b1a10" }}>
                <Link to="/" style={{ color: "#E0A96D", fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Cinzel', serif", textDecoration: "none" }}>
                    Q-MÉTIER
                </Link>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                        onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                        style={{ color: "#E0A96D", fontSize: "0.875rem", fontWeight: "bold", opacity: 0.8, cursor: "pointer", background: "none", border: "none" }}
                    >
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>
                    <button style={{ padding: "8px 16px", border: "1px solid #E0A96D", color: "#E0A96D", borderRadius: "4px", fontSize: "0.875rem", background: "transparent", cursor: "pointer", transition: "all 0.3s ease" }}>
                        {lang === 'fr' ? 'Connexion' : 'Login'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div style={{ padding: "80px 24px", maxWidth: "1024px", margin: "0 auto", textAlign: "center" }}>
                <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, marginBottom: "24px", fontFamily: "'Playfair Display', serif", color: "#F2D4B6" }}>
                    {lang === 'fr' ? "L'Élite des Métiers du Québec" : "The Elite Trades of Quebec"}
                </h1>
                <p style={{ fontSize: "clamp(1.125rem, 2vw, 1.25rem)", color: "#D1B295", maxWidth: "768px", margin: "0 auto 48px auto", lineHeight: "1.6" }}>
                    {lang === 'fr'
                        ? "Accès exclusif aux meilleurs entrepreneurs vérifiés RBQ. Plomberie, électricité, et construction de prestige gérés par intelligence artificielle souveraine."
                        : "Exclusive access to the best RBQ-verified contractors. Plumbing, electrical, and prestige construction managed by sovereign AI."}
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
                    <button style={{ padding: "16px 32px", background: "linear-gradient(to right, #B66D38, #8A4A25)", color: "white", fontWeight: "bold", borderRadius: "4px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", border: "1px solid #E0A96D", cursor: "pointer", fontSize: "1rem" }}>
                        {lang === 'fr' ? "Soumettre un projet VIP" : "Submit VIP Project"}
                    </button>
                    <button style={{ padding: "16px 32px", background: "transparent", border: "2px solid #5a3a28", color: "#E0A96D", fontWeight: "bold", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" }}>
                        {lang === 'fr' ? "Rejoindre l'Élite (RBQ)" : "Join the Elite (RBQ)"}
                    </button>
                </div>
            </div>

            {/* verification banner */}
            <div style={{ backgroundColor: "#2b1a10", borderTop: "1px solid #5a3a28", borderBottom: "1px solid #5a3a28", padding: "48px 0" }}>
                <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", textAlign: "center" }}>
                    <div className="stitch-box" style={{ padding: "32px" }}>
                        <h3 style={{ color: "#E0A96D", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>Validation RBQ</h3>
                        <p style={{ color: "#D1B295", fontSize: "0.875rem", margin: 0 }}>Vérification en temps réel des licences et assurances.</p>
                    </div>
                    <div className="stitch-box" style={{ padding: "32px" }}>
                        <h3 style={{ color: "#E0A96D", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>Contrats Garantis</h3>
                        <p style={{ color: "#D1B295", fontSize: "0.875rem", margin: 0 }}>Paiements sécurisés par L'Atelier avec libération sur jalon.</p>
                    </div>
                    <div className="stitch-box" style={{ padding: "32px" }}>
                        <h3 style={{ color: "#E0A96D", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>IA Souveraine</h3>
                        <p style={{ color: "#D1B295", fontSize: "0.875rem", margin: 0 }}>Vos données et historiques de chantiers restent au Québec.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
