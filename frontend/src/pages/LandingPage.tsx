import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "../components/SEOHead";

/* ΓöÇΓöÇΓöÇ TRANSLATIONS ΓöÇΓöÇΓöÇ */
const T = {
  fr: {
    nav: { find: "Trouver un job", become: "Poster une offre", login: "Connexion", signup: "S'inscrire" },
    hero: {
      h1: "Tous les jobs, au m├¬me endroit.",
      sub: "Trouvez un job ou postulez en quelques clics. Livraison, bricolage, serveur, informatique... tout est l├á.",
      ph: "Que faut-il faire ?",
      cta: "R├⌐server maintenant",
    },
    cats: {
      title: "Tous types de jobs",
      items: [
        { icon: "≡ƒÜÜ", name: "Livraison & Transport", desc: "Coursier, chauffeur, d├⌐m├⌐nagement." },
        { icon: "≡ƒì╜∩╕Å", name: "Restauration & ├ëv├⌐nements", desc: "Serveur, barman, s├⌐curit├⌐, animation." },
        { icon: "≡ƒÆ╗", name: "Tech & Informatique", desc: "Aide PC, r├⌐paration t├⌐l├⌐phone, graphisme." },
        { icon: "≡ƒöº", name: "Bricolage & R├⌐parations", desc: "Montage meubles, petits travaux, m├⌐nage." },
        { icon: "≡ƒÄô", name: "├ëducation & Services", desc: "Tutorat, garde d'enfants, promenade chiens." },
        { icon: "≡ƒÆ¬", name: "Manutention & Aide", desc: "D├⌐m├⌐nagement, portage, aide senior." },
      ],
    },
    how: {
      title: "Comment ├ºa marche",
      stepLabel: "├ëtape",
      steps: [
        { ic: "≡ƒô¥", t: "D├⌐crivez", d: "Mentionnez vos besoins pour trouver le bon pro." },
        { ic: "≡ƒöì", t: "Trouvez", d: "On jumelle le meilleur pro pr├¿s de chez vous." },
        { ic: "≡ƒôà", t: "R├⌐servez", d: "R├⌐servez votre cr├⌐neau en quelques clics." },
        { ic: "≡ƒÆ░", t: "Payez", d: "Payez en ligne de fa├ºon s├⌐curis├⌐e via Stripe." },
      ],
    },
    wa: {
      title: "Parlez ├á Max sur WhatsApp",
      sub: "Notre IA vous trouve un job ou un employ├⌐ en moins de 5 minutes.",
      cta: "Envoyer un message ├á Max",
      msgs: [
        { r: "u", t: "Salut Max, je cherche un job de livreur ├á Montr├⌐al" },
        { r: "b", t: "Envoye! ≡ƒÜÜ J'ai 5 offres pr├¿s de chez toi. Voici la meilleure :" },
        { r: "b", t: "≡ƒôª Livreur Colis ΓÇö 22$/h ΓÇö 1.8 km\n≡ƒôà Aujourd'hui 14h-18h\n\n[Postuler]  [Voir d'autres]" },
        { r: "u", t: "Postuler" },
        { r: "b", t: "Γ£à C'est envoy├⌐! L'employeur te contactera dans les 30 min. Bonne chance! ≡ƒì»" },
      ],
      online: "En ligne",
    },
    pro: {
      title: "Vous cherchez du travail ?",
      sub: "Inscrivez-vous gratuitement et recevez des offres pr├¿s de chez vous. ├ëtudiants, retrait├⌐s, travailleurs autonomes ΓÇö tous sont bienvenus.",
      perks: [
        "Recevez des offres directement sur WhatsApp",
        "Paiements s├⌐curis├⌐s via Stripe ΓÇö fini le cash",
        "Travaillez quand vous voulez, o├╣ vous voulez",
        "Pas de licence requise pour la plupart des jobs",
      ],
      cta: "Commencer ├á gagner",
      sub2: "Inscription gratuite ΓÇö commencez aujourd'hui",
    },
    foot: {
      tag: "Tous les jobs du Qu├⌐bec ΓÇö accessible ├á tous.",
      legal: "Conforme ├á la Loi 96 (langue) et la Loi 25 (vie priv├⌐e).",
      copy: "┬⌐ 2026 Q-emplois. Tous droits r├⌐serv├⌐s.",
    },
  },
  en: {
    nav: { find: "Find a job", become: "Post a job", login: "Log in", signup: "Sign up" },
    hero: {
      h1: "All jobs, one place.",
      sub: "Find a job or hire help in minutes. Delivery, handyman, server, tech... it's all here.",
      ph: "What do you need done?",
      cta: "Book now",
    },
    cats: {
      title: "All Job Types",
      items: [
        { icon: "≡ƒÜÜ", name: "Delivery & Transport", desc: "Courier, driver, moving help." },
        { icon: "≡ƒì╜∩╕Å", name: "Food Service & Events", desc: "Server, bartender, security, DJ." },
        { icon: "≡ƒÆ╗", name: "Tech & IT", desc: "PC help, phone repair, graphic design." },
        { icon: "≡ƒöº", name: "Handyman & Repairs", desc: "Furniture assembly, small jobs, cleaning." },
        { icon: "≡ƒÄô", name: "Education & Care", desc: "Tutoring, childcare, dog walking." },
        { icon: "≡ƒÆ¬", name: "Labor & Moving Help", desc: "Heavy lifting, moving assistance, senior care." },
      ],
    },
    how: {
      title: "How it works",
      stepLabel: "Step",
      steps: [
        { ic: "≡ƒô¥", t: "Describe", d: "Tell us what you need to find the right pro." },
        { ic: "≡ƒöì", t: "Find", d: "We match the best pro near you." },
        { ic: "≡ƒôà", t: "Book", d: "Reserve your time slot in a few clicks." },
        { ic: "≡ƒÆ░", t: "Pay", d: "Pay securely online via Stripe." },
      ],
    },
    wa: {
      title: "Talk to Max on WhatsApp",
      sub: "Our AI finds you a job or an employee in under 5 minutes.",
      cta: "Message Max",
      msgs: [
        { r: "u", t: "Hey Max, I'm looking for a delivery job in Montreal" },
        { r: "b", t: "Let's go! ≡ƒÜÜ I've got 5 offers near you. Here's the best:" },
        { r: "b", t: "≡ƒôª Package Delivery ΓÇö $22/h ΓÇö 1.8 km\n≡ƒôà Today 2pm-6pm\n\n[Apply]  [See others]" },
        { r: "u", t: "Apply" },
        { r: "b", t: "Γ£à Sent! The employer will contact you within 30 min. Good luck! ≡ƒì»" },
      ],
      online: "Online",
    },
    pro: {
      title: "Looking for work?",
      sub: "Sign up for free and get job offers near you. Students, retirees, freelancers ΓÇö everyone is welcome.",
      perks: [
        "Get job offers directly on WhatsApp",
        "Secure payments via Stripe ΓÇö no more cash",
        "Work when you want, where you want",
        "No license required for most jobs",
      ],
      cta: "Start earning",
      sub2: "Free signup ΓÇö start today",
    },
    foot: {
      tag: "All jobs in Qu├⌐bec ΓÇö accessible to everyone.",
      legal: "Compliant with Bill 96 (language) and Law 25 (privacy).",
      copy: "┬⌐ 2026 Q-emplois. All rights reserved.",
    },
  },
};

/* ΓöÇΓöÇΓöÇ LOGO COMPONENT ΓöÇΓöÇΓöÇ */
const Logo = ({ size = "md" }: { size?: "lg" | "md" | "sm" }) => {
  const sz = { lg: "text-3xl", md: "text-xl", sm: "text-base" }[size];
  return (
    <span className={`${sz} tracking-wide`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
      <span style={{ color: "#D9B38C", fontWeight: 700 }}>Q</span>
      <span style={{ color: "#B87B44", fontSize: "0.75em", verticalAlign: "middle" }}>ΓÜ£</span>
      <span style={{ color: "#D9B38C", fontStyle: "italic", fontWeight: 400 }}>emplois</span>
    </span>
  );
};

/* ΓöÇΓöÇΓöÇ MAIN COMPONENT ΓöÇΓöÇΓöÇ */
export function LandingPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = T[lang];

  // SEO content based on language
  const seoContent = {
    fr: {
      title: "Q-emplois | Tous les jobs du Qu├⌐bec - Livraison, Bricolage, Tech & Plus",
      description: "Trouvez un job ou postulez en quelques clics. Livraison, bricolage, serveur, informatique, d├⌐m├⌐nagement. Plateforme qu├⌐b├⌐coise pour tous types de jobs. Inscription gratuite.",
      keywords: "emploi qu├⌐bec, job montr├⌐al, livraison, bricolage, d├⌐m├⌐nagement, serveur, informatique, petits boulots, travail autonome, gig economy, taskrabbit qu├⌐bec, jobs ├⌐tudiants, emploi temporaire, aide d├⌐m├⌐nagement, r├⌐paration, montage meubles, coursier, chauffeur, tutorat, garde enfants, m├⌐nage, manutention, jobs qu├⌐bec, emplois montr├⌐al, travail flexible"
    },
    en: {
      title: "Q-emplois | All Quebec Jobs - Delivery, Handyman, Tech & More",
      description: "Find a job or hire help in minutes. Delivery, handyman, server, tech, moving. Quebec's platform for all job types. Free signup.",
      keywords: "quebec jobs, montreal jobs, delivery, handyman, moving, server, tech, gig work, freelance, taskrabbit quebec, student jobs, temporary work, moving help, repairs, furniture assembly, courier, driver, tutoring, childcare, cleaning, labor, flexible work"
    }
  };

  const seo = seoContent[lang];

  return (
    <div style={{ background: "#1F2F3F", minHeight: "100vh", color: "#D9B38C" }}>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        lang={lang}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }

        /* ΓöÇΓöÇ LEATHER TEXTURE ΓöÇΓöÇ */
        .leather {
          background-color: #1F2F3F;
          background-image:
            radial-gradient(ellipse at 30% 30%, rgba(184,123,68,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 70%, rgba(184,123,68,0.03) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }

        /* ΓöÇΓöÇ STITCHING ΓöÇΓöÇ */
        .stitch-h {
          background-image: repeating-linear-gradient(
            90deg,
            #D9B38C 0px, #D9B38C 8px,
            transparent 8px, transparent 16px
          );
          height: 2px;
          opacity: 0.45;
        }
        .stitch-box {
          border: 2px dashed rgba(217,179,140,0.35);
          border-radius: 12px;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.25);
        }

        /* ΓöÇΓöÇ GOLD BUTTON ΓöÇΓöÇ */
        .gold-btn {
          background: linear-gradient(180deg, #C88B54, #A06A38);
          color: #1F2F3F;
          font-weight: 700;
          border: 2px dashed rgba(26,42,58,0.25);
          border-radius: 8px;
          box-shadow:
            0 0 0 3px #B87B44,
            inset 0 1px 2px rgba(255,255,255,0.15),
            0 4px 12px rgba(0,0,0,0.35);
          cursor: pointer;
          transition: all 0.25s ease;
          text-shadow: 0 1px 0 rgba(255,255,255,0.1);
          font-family: 'Lora', Georgia, serif;
        }
        .gold-btn:hover {
          background: linear-gradient(180deg, #D49B64, #B07A48);
          box-shadow:
            0 0 0 3px #D4A06A,
            inset 0 1px 2px rgba(255,255,255,0.15),
            0 6px 20px rgba(184,123,68,0.35);
          transform: translateY(-1px);
        }

        /* ΓöÇΓöÇ WHATSAPP BUTTON ΓöÇΓöÇ */
        .wa-btn {
          background: linear-gradient(180deg, #2BD47A, #1FA855);
          color: white;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(37,211,102,0.3);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Lora', Georgia, serif;
        }
        .wa-btn:hover {
          background: linear-gradient(180deg, #3DE88A, #25C05F);
          box-shadow: 0 6px 25px rgba(37,211,102,0.4);
          transform: translateY(-1px);
        }

        /* ΓöÇΓöÇ SERVICE ICON CIRCLE ΓöÇΓöÇ */
        .svc-icon {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: linear-gradient(145deg, #B87B44, #8B5E30);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px;
          border: 2px solid rgba(217,179,140,0.3);
          box-shadow:
            inset 0 2px 4px rgba(255,255,255,0.12),
            0 4px 14px rgba(0,0,0,0.35);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .svc-icon:hover {
          transform: scale(1.1);
          box-shadow:
            inset 0 2px 4px rgba(255,255,255,0.12),
            0 8px 25px rgba(184,123,68,0.3);
        }

        /* ΓöÇΓöÇ STEP CIRCLE ΓöÇΓöÇ */
        .step-circ {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(145deg, #B87B44, #8B5E30);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          border: 2px solid rgba(217,179,140,0.3);
          box-shadow:
            inset 0 2px 3px rgba(255,255,255,0.1),
            0 3px 10px rgba(0,0,0,0.3);
        }

        /* ΓöÇΓöÇ CHAT BUBBLE ANIMATION ΓöÇΓöÇ */
        .chat-in {
          animation: chatSlide 0.4s ease-out forwards;
          opacity: 0;
        }
        @keyframes chatSlide {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ΓöÇΓöÇ DIVIDER ΓöÇΓöÇ */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(217,179,140,0.15), transparent);
        }

        /* ΓöÇΓöÇ UTILITIES ΓöÇΓöÇ */
        .serif  { font-family: 'Playfair Display', Georgia, serif; }
        .body-f { font-family: 'Lora', Georgia, serif; }
        .gold   { color: #B87B44; }
        .cream  { color: #D9B38C; }
        .cream-hi { color: #E8CDB0; }
        .muted  { color: #C4A882; }
        .muted2 { color: #9A8468; }

        a { text-decoration: none; transition: color 0.2s; }
        a.nav-link { color: #D9B38C; }
        a.nav-link:hover { color: #B87B44; }

        /* ΓöÇΓöÇ EMPIRE SPLIT ΓöÇΓöÇ */
        .empire-split {
          background: linear-gradient(180deg, rgba(31, 47, 63, 0.95), rgba(31, 47, 63, 0.8));
          backdrop-filter: blur(8px);
          border-bottom: 2px dashed rgba(217, 179, 140, 0.2);
        }
      `}</style>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ NAVBAR ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(31,47,63,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "2px dashed rgba(217,179,140,0.2)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="body-f" style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}>
            <Link to="/contrats" className="nav-link" style={{ color: "#D9B38C" }}>{t.nav.find}</Link>
            <Link to="/pro" className="nav-link" style={{ color: "#D9B38C" }}>{t.nav.become}</Link>
            <Link to="/login" className="nav-link" style={{ color: "#D9B38C" }}>{t.nav.login}</Link>
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              style={{
                padding: "4px 12px",
                border: "1px dashed rgba(217,179,140,0.35)",
                borderRadius: 6,
                background: "transparent",
                color: "#D9B38C",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              {lang === "fr" ? "EN" : "FR"}
            </button>
            <button className="gold-btn" style={{ padding: "8px 18px", fontSize: 13 }}>
              {t.nav.signup}
            </button>
          </div>
        </div>
      </nav>

      {/* ΓöÇΓöÇΓöÇ NOUVEAU: LE PORTAIL DE L'EMPIRE ΓöÇΓöÇΓöÇ */}
      <div className="empire-split relative overflow-hidden" style={{ paddingTop: "110px", paddingBottom: "40px", paddingLeft: "24px", paddingRight: "24px" }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 10
        }}>

          {/* Option Q-M├ëTIER */}
          <div className="stitch-box group" style={{
            flex: "1 1 300px",
            padding: "32px",
            background: "rgba(22, 34, 46, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.3s",
            minHeight: "260px"
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(26, 40, 54, 0.95)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(22, 34, 46, 0.8)"}
          >
            <div>
              <div style={{ color: "#C88B54", fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", letterSpacing: "0.3em", marginBottom: "8px" }}>Q-business</div>
              <h3 style={{ fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", color: "#D9B38C", marginBottom: "12px", fontWeight: "bold" }}>
                {lang === 'fr' ? "L'├ëlite des M├⌐tiers" : "The Elite of Trades"}
              </h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.8, marginBottom: "24px", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" }}>
                {lang === 'fr' ? "Professionnels v├⌐rifi├⌐s (RBQ)." : "Verified Professionals (RBQ)."}<br />
                {lang === 'fr' ? "Plomberie, ├⌐lectricit├⌐, et contrats de prestige." : "Plumbing, electrical, and prestige contracts."}
              </p>
            </div>
            <Link to="/q-business" className="gold-btn" style={{ textAlign: "center", display: "block", padding: "12px", fontSize: "0.9rem" }}>
              {lang === 'fr' ? "Entrer au Quartier Général" : "Entering Headquarters"}
            </Link>
          </div>

          {/* Option Q-EMPLOIS (Current) */}
          <div className="stitch-box group" style={{
            flex: "1 1 300px",
            padding: "32px",
            background: "rgba(22, 34, 46, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.3s",
            minHeight: "260px"
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(26, 40, 54, 0.95)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(22, 34, 46, 0.8)"}
          >
            <div>
              <div style={{ color: "#D9B38C", fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", letterSpacing: "0.3em", marginBottom: "8px" }}>Q-jobs</div>
              <h3 style={{ fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", color: "#fff", marginBottom: "12px", fontWeight: "bold" }}>
                {lang === 'fr' ? "Le Marché Local" : "The Local Market"}
              </h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.8, marginBottom: "24px", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" }}>
                {lang === 'fr' ? "Petits travaux, déménagement, livraison." : "Small jobs, moving, delivery."}<br />
                {lang === 'fr' ? "Au service des citoyens, de voisin à voisin." : "Serving citizens, from neighbor to neighbor."}
              </p>
            </div>
            <Link to="/q-jobs" className="gold-btn" style={{ textAlign: "center", display: "block", padding: "12px", fontSize: "0.9rem" }}>
              {lang === 'fr' ? "Accéder au Marché Local" : "Access the Local Market"}
            </Link>
          </div>

        </div>
      </div>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ FOOTER ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <footer
        style={{
          background: "rgba(18,30,42,0.9)",
          borderTop: "2px dashed rgba(217,179,140,0.2)",
          padding: "32px 24px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <Link to="/">
                <Logo size="sm" />
              </Link>
              <p className="body-f muted2" style={{ fontSize: 12, marginTop: 6 }}>
                {t.foot.tag}
              </p>
            </div>
            <div className="body-f" style={{ display: "flex", gap: 20, fontSize: 13 }}>
              <Link to="/contrats" style={{ color: "#9A8468" }}>
                {t.nav.find}
              </Link>
              <Link to="/pro" style={{ color: "#9A8468" }}>
                {t.nav.become}
              </Link>
              <Link to="/login" style={{ color: "#9A8468" }}>
                {t.nav.login}
              </Link>
              <Link to="/pro" style={{ color: "#9A8468" }}>
                {t.nav.signup}
              </Link>
            </div>
          </div>
          <div className="divider" style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 11 }}>
            <span className="muted2">{t.foot.legal}</span>
            <span className="muted2">{t.foot.copy}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
