import { useState } from 'react';
import { Link } from 'react-router-dom';

export function PortalPage() {
    const [lang, setLang] = useState<'fr' | 'en'>('fr');

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a0f0a",
            backgroundImage: "radial-gradient(circle at top, #2b1a10 0%, #1a0f0a 100%)",
            padding: "40px 0"
        }}>

            {/* Top right language toggle */}
            <div style={{ position: "absolute", top: "24px", right: "32px", zIndex: 50 }}>
                <button
                    onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                    style={{
                        color: "#E0A96D",
                        opacity: 0.7,
                        fontWeight: "bold",
                        letterSpacing: "0.1em",
                        fontSize: "0.875rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textTransform: "uppercase"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                    {lang === 'fr' ? 'EN' : 'FR'}
                </button>
            </div>

            <div style={{ textAlign: "center", marginBottom: "64px", padding: "0 24px" }}>
                <h1 className="serif cream-hi" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, letterSpacing: "8px", textTransform: "uppercase", margin: "0 0 16px 0" }}>
                    L'Empire du Travail
                </h1>
                <p style={{ color: "#E0A96D", letterSpacing: "0.3em", textTransform: "uppercase", fontSize: "0.875rem", fontWeight: "bold", opacity: 0.8, fontFamily: "'Inter', sans-serif", margin: 0 }}>
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

            <div style={{ marginTop: "64px", opacity: 0.4, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "bold", color: "#E0A96D" }}>
                © 2026 MAXIMUS IMPERIAL | SOUVERAINETÉ NUMÉRIQUE
            </div>
        </div>
    );
}
