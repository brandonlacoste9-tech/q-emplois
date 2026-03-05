import { useState } from 'react';
import { Link } from 'react-router-dom';

export function PortalPage() {
    const [lang, setLang] = useState<'fr' | 'en'>('fr');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a0f0a]" style={{ backgroundImage: "radial-gradient(circle at top, #2b1a10 0%, #1a0f0a 100%)" }}>

            {/* Top right language toggle */}
            <div className="absolute top-6 right-8">
                <button
                    onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                    className="text-[#E0A96D] opacity-70 hover:opacity-100 transition-opacity font-bold tracking-widest text-sm"
                >
                    {lang === 'fr' ? 'EN' : 'FR'}
                </button>
            </div>

            <div className="text-center mb-16">
                <h1 className="serif cream-hi" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, letterSpacing: "8px", textTransform: "uppercase" }}>
                    L'Empire du Travail
                </h1>
                <p className="text-[#E0A96D] tracking-[0.3em] uppercase text-sm mt-4 font-bold opacity-80" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {lang === 'fr' ? "Sélectionnez votre quartier général" : "Select your headquarters"}
                </p>
            </div>

            <div className="empire-split relative overflow-hidden" style={{ width: "100%", paddingLeft: "24px", paddingRight: "24px" }}>
                <div style={{
                    maxWidth: "900px",
                    margin: "0 auto",
                    display: "flex",
                    gap: "24px",
                    flexWrap: "wrap",
                    position: "relative",
                    zIndex: 10
                }}>

                    {/* Option Q-MÉTIER: Imperial Leather Aesthetic */}
                    <div className="stitch-box stitch-box-interactive group" style={{
                        flex: "1 1 300px",
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "260px"
                    }}>
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <div style={{ color: "#E0A96D", fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", letterSpacing: "0.3em", marginBottom: "8px", textTransform: "uppercase", fontWeight: "bold" }}>Q-business</div>
                            <h3 style={{ fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", color: "#F2D4B6", marginBottom: "12px", fontWeight: "900", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                                {lang === 'fr' ? "L'Élite des Métiers" : "The Elite of Trades"}
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "#D1B295", opacity: 0.9, marginBottom: "24px", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" }}>
                                {lang === 'fr' ? "Professionnels vérifiés (RBQ)." : "Verified Professionals (RBQ)."}<br />
                                {lang === 'fr' ? "Plomberie, électricité, et contrats de prestige." : "Plumbing, electrical, and prestige contracts."}
                            </p>
                        </div>
                        <Link to="/q-business" className="gold-btn" style={{
                            textAlign: "center", display: "block", padding: "12px", fontSize: "0.95rem",
                            background: "linear-gradient(to right, #B66D38, #8A4A25)", border: "1px solid #E0A96D",
                            color: "#FFF", fontWeight: "bold", textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            position: "relative", zIndex: 10, textDecoration: "none"
                        }}>
                            {lang === 'fr' ? "Entrer au Quartier Général" : "Entering Headquarters"}
                        </Link>
                    </div>

                    {/* Option Q-EMPLOIS: Imperial Leather Aesthetic */}
                    <div className="stitch-box stitch-box-interactive group" style={{
                        flex: "1 1 300px",
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "260px"
                    }}>
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <div style={{ color: "#E0A96D", fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", letterSpacing: "0.3em", marginBottom: "8px", textTransform: "uppercase", fontWeight: "bold" }}>Q-jobs</div>
                            <h3 style={{ fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", color: "#F2D4B6", marginBottom: "12px", fontWeight: "900", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                                {lang === 'fr' ? "Le Marché Local" : "The Local Market"}
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "#D1B295", opacity: 0.9, marginBottom: "24px", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" }}>
                                {lang === 'fr' ? "Petits travaux, déménagement, livraison." : "Small jobs, moving, delivery."}<br />
                                {lang === 'fr' ? "Au service des citoyens, de voisin à voisin." : "Serving citizens, from neighbor to neighbor."}
                            </p>
                        </div>
                        <Link to="/q-jobs" className="gold-btn" style={{
                            textAlign: "center", display: "block", padding: "12px", fontSize: "0.95rem",
                            background: "linear-gradient(to right, #B66D38, #8A4A25)", border: "1px solid #E0A96D",
                            color: "#FFF", fontWeight: "bold", textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            position: "relative", zIndex: 10, textDecoration: "none"
                        }}>
                            {lang === 'fr' ? "Accéder au Marché Local" : "Access the Local Market"}
                        </Link>
                    </div>

                </div>
            </div>

            <div className="mt-16 opacity-40 text-xs tracking-widest uppercase font-bold text-[#E0A96D]">
                © 2026 MAXIMUS IMPERIAL | SOUVERAINETÉ NUMÉRIQUE
            </div>
        </div>
    );
}
