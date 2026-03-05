import { useState, useEffect } from "react";
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

/* ΓöÇΓöÇΓöÇ WHATSAPP ICON ΓöÇΓöÇΓöÇ */
const WaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ΓöÇΓöÇΓöÇ MAIN COMPONENT ΓöÇΓöÇΓöÇ */
export function LandingPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [q, setQ] = useState("");
  const [chatIdx, setChatIdx] = useState(0);
  const t = T[lang];

  useEffect(() => {
    setChatIdx(0);
  }, [lang]);

  useEffect(() => {
    if (chatIdx < t.wa.msgs.length - 1) {
      const id = setTimeout(() => setChatIdx((i) => i + 1), 1800);
      return () => clearTimeout(id);
    }
  }, [chatIdx, t.wa.msgs.length]);

  const whatsappUrl = import.meta.env.VITE_WHATSAPP_URL ?? "https://wa.me/";

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
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(26, 40, 54, 0.95)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(22, 34, 46, 0.8)"}
          >
            <div>
              <div style={{ color: "#D9B38C", fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", letterSpacing: "0.3em", marginBottom: "8px" }}>Q-jobs</div>
              <h3 style={{ fontSize: "1.75rem", fontFamily: "'Playfair Display', serif", color: "#fff", marginBottom: "12px", fontWeight: "bold" }}>
                {lang === 'fr' ? "Le March├⌐ Local" : "The Local Market"}
              </h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.8, marginBottom: "24px", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" }}>
                {lang === 'fr' ? "La plateforme o├╣ vous ├¬tes pr├⌐sentement." : "The platform you are currently on."}<br />
                {lang === 'fr' ? "Petits travaux, livraison, de voisin ├á voisin." : "Small jobs, delivery, from neighbor to neighbor."}
              </p>
            </div>
            <a href="#services" className="gold-btn" style={{ textAlign: "center", display: "block", padding: "12px", fontSize: "0.9rem" }} onClick={(e) => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}>
              {lang === 'fr' ? "Accéder au Marché Local" : "Access the Local Market"}
            </a>
          </div>

        </div>
      </div>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ HERO ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="leather" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <h1 className="serif cream-hi" style={{ fontSize: "clamp(2.5rem, 6vw, 4.2rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            {t.hero.h1}
          </h1>
          <p className="body-f muted" style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", marginBottom: 40 }}>
            {t.hero.sub}
          </p>

          {/* SEARCH BAR */}
          <div
            className="stitch-box"
            style={{
              maxWidth: 620,
              margin: "0 auto",
              display: "flex",
              overflow: "hidden",
              background: "rgba(31,47,63,0.6)",
              padding: "6px"
            }}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "8px 14px", gap: 10 }}>
              <svg width="18" height="18" fill="none" stroke="#B87B44" strokeWidth="2">
                <circle cx="8" cy="8" r="6" />
                <path d="m13 13 4 4" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.hero.ph}
                className="body-f"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#E8CDB0",
                  fontSize: 15,
                }}
              />
            </div>
            <Link to="/contrats" className="gold-btn" style={{ padding: "12px 24px", fontSize: 15, whiteSpace: "nowrap", border: "none" }}>
              {t.hero.cta}
            </Link>
          </div>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ SERVICES ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="services" className="leather" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 className="serif cream-hi" style={{ textAlign: "center", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 50 }}>
            {t.cats.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 36 }}>
            {t.cats.items.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div className="svc-icon">{c.icon}</div>
                <h3 className="serif cream-hi" style={{ fontSize: 15, fontWeight: 700, marginTop: 14, marginBottom: 6 }}>
                  {c.name}
                </h3>
                <p className="body-f muted2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ HOW IT WORKS ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="leather" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 className="serif cream-hi" style={{ textAlign: "center", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 50 }}>
            {t.how.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32 }}>
            {t.how.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div className="step-circ">{s.ic}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B87B44", fontFamily: "monospace", marginTop: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {t.how.stepLabel} {i + 1}
                </div>
                <h3 className="serif cream-hi" style={{ fontSize: 15, fontWeight: 700, marginTop: 6, marginBottom: 6 }}>
                  {s.t}
                </h3>
                <p className="body-f muted2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ WHATSAPP / MAX ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="leather" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
            {/* Left copy */}
            <div>
              <h2 className="serif cream-hi" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, marginBottom: 12 }}>
                {t.wa.title}
              </h2>
              <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                {t.wa.sub}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn"
                style={{ padding: "14px 28px", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 10 }}
              >
                <WaIcon />
                {t.wa.cta}
              </a>
            </div>

            {/* Chat mockup */}
            <div className="stitch-box" style={{ background: "rgba(21,35,50,0.8)", padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px dashed rgba(217,179,140,0.2)",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "linear-gradient(145deg, #B87B44, #8B5E30)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  ≡ƒñû
                </div>
                <div>
                  <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: "#E8CDB0" }}>
                    Max (Ti-Guy)
                  </div>
                  <div style={{ fontSize: 11, color: "#4ade80" }}>ΓùÅ {t.wa.online}</div>
                </div>
              </div>
              <div style={{ minHeight: 220, display: "flex", flexDirection: "column", gap: 8 }}>
                {t.wa.msgs.slice(0, chatIdx + 1).map((m, i) => (
                  <div key={i} className="chat-in" style={{ display: "flex", justifyContent: m.r === "u" ? "flex-end" : "flex-start" }}>
                    <div
                      className="body-f"
                      style={{
                        maxWidth: "85%",
                        padding: "10px 14px",
                        borderRadius: 14,
                        borderBottomRightRadius: m.r === "u" ? 4 : 14,
                        borderBottomLeftRadius: m.r === "b" ? 4 : 14,
                        fontSize: 13,
                        whiteSpace: "pre-line",
                        lineHeight: 1.5,
                        background: m.r === "u" ? "#B87B44" : "rgba(217,179,140,0.1)",
                        color: m.r === "u" ? "#1F2F3F" : "#E8CDB0",
                        border: m.r === "b" ? "1px solid rgba(217,179,140,0.12)" : "none",
                      }}
                    >
                      {m.t}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ PROVIDER CTA ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="providers" className="leather" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 className="serif cream-hi" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 12 }}>
            {t.pro.title}
          </h2>
          <p className="body-f muted" style={{ fontSize: 15, marginBottom: 32 }}>
            {t.pro.sub}
          </p>
          <div className="stitch-box" style={{ padding: "32px 28px", marginBottom: 32, background: "rgba(21,35,50,0.6)", textAlign: "left" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {t.pro.perks.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#B87B44", fontSize: 16, marginTop: 2 }}>ΓÜí</span>
                  <span className="body-f" style={{ color: "#D9B38C", fontSize: 13, lineHeight: 1.6 }}>
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/pro" className="gold-btn" style={{ padding: "14px 32px", fontSize: 16 }}>
            {t.pro.cta}
          </Link>
          <p className="body-f muted2" style={{ fontSize: 12, marginTop: 10 }}>
            {t.pro.sub2}
          </p>
        </div>
      </section>

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
