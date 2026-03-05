import { useState } from 'react';
import { Link } from 'react-router-dom';

export function QJobsPage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a0f0a", color: "#f4ece0", fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid #5a3a28", backgroundColor: "#2b1a10" }}>
        <Link to="/" style={{ color: "#E0A96D", fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Cinzel', serif", textDecoration: "none" }}>
          Q-EMPLOIS
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
          {lang === 'fr' ? "Le Marché Local" : "The Local Market"}
        </h1>
        <p style={{ fontSize: "clamp(1.125rem, 2vw, 1.25rem)", color: "#D1B295", maxWidth: "768px", margin: "0 auto 48px auto", lineHeight: "1.6" }}>
          {lang === 'fr'
            ? "La plateforme de tous les jobs quotidiens. Livraison, déménagement, petits travaux et entraide de voisin à voisin. Entièrement gratuite et accessible à tous."
            : "The platform for all daily jobs. Delivery, moving, small tasks, and neighbor-to-neighbor help. Completely free and accessible to everyone."}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          {/* These buttons link back to the main site search & post areas */}
          <Link to="/" style={{ padding: "16px 32px", background: "linear-gradient(to right, #B66D38, #8A4A25)", color: "white", fontWeight: "bold", borderRadius: "4px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", border: "1px solid #E0A96D", cursor: "pointer", fontSize: "1rem", textDecoration: "none" }}>
            {lang === 'fr' ? "Trouver un Job" : "Find a Job"}
          </Link>
          <Link to="/" style={{ padding: "16px 32px", background: "transparent", border: "2px solid #5a3a28", color: "#E0A96D", fontWeight: "bold", borderRadius: "4px", cursor: "pointer", fontSize: "1rem", textDecoration: "none" }}>
            {lang === 'fr' ? "Publier une Offre" : "Post an Offer"}
          </Link>
        </div>
      </div>

      {/* verification banner */}
      <div style={{ backgroundColor: "#2b1a10", borderTop: "1px solid #5a3a28", borderBottom: "1px solid #5a3a28", padding: "48px 0" }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", textAlign: "center" }}>
          <div className="stitch-box" style={{ padding: "32px", border: "2px dashed rgba(217,179,140,0.35)", borderRadius: "12px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)" }}>
            <h3 style={{ color: "#E0A96D", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>
              {lang === 'fr' ? "Aucune Licence Requise" : "No License Required"}
            </h3>
            <p style={{ color: "#D1B295", fontSize: "0.875rem", margin: 0 }}>
              {lang === 'fr' ? "Idéal pour les étudiants, retraités et travailleurs autonomes." : "Ideal for students, retirees, and freelancers."}
            </p>
          </div>
          <div className="stitch-box" style={{ padding: "32px", border: "2px dashed rgba(217,179,140,0.35)", borderRadius: "12px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)" }}>
            <h3 style={{ color: "#E0A96D", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>
              {lang === 'fr' ? "Paiements Sécurisés" : "Secure Payments"}
            </h3>
            <p style={{ color: "#D1B295", fontSize: "0.875rem", margin: 0 }}>
              {lang === 'fr' ? "Gérés directement dans l'application via Stripe." : "Managed directly in the app via Stripe."}
            </p>
          </div>
          <div className="stitch-box" style={{ padding: "32px", border: "2px dashed rgba(217,179,140,0.35)", borderRadius: "12px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)" }}>
            <h3 style={{ color: "#E0A96D", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>
              {lang === 'fr' ? "IA Assistant Max" : "Max AI Assistant"}
            </h3>
            <p style={{ color: "#D1B295", fontSize: "0.875rem", margin: 0 }}>
              {lang === 'fr' ? "Trouvez du travail en 5 minutes directement sur WhatsApp." : "Find work in 5 minutes straight on WhatsApp."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
