import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/* ─── TRANSLATIONS ─── */
const T = {
  fr: {
    nav: { find: "Trouver un Pro", become: "Devenir Pro", login: "Connexion", signup: "S'inscrire" },
    hero: {
      h1: "Le bon pro, au bon moment.",
      sub: "Trouvez de l'aide fiable pour toutes vos tâches au Québec.",
      ph: "Que faut-il faire ?",
      cta: "Réserver maintenant",
    },
    cats: {
      title: "Nos services",
      items: [
        { icon: "🧹", name: "Tâches Ménagères", desc: "Trouvez de l'aide pour vos tâches ménagères." },
        { icon: "🔧", name: "Réparations", desc: "Aide fiable pour toutes réparations au Québec." },
        { icon: "🚚", name: "Déménagement", desc: "Déménagement, entreposage, transport." },
        { icon: "⚡", name: "Électricité", desc: "Panneaux, prises, éclairage — licence vérifiée." },
        { icon: "🔨", name: "Plomberie", desc: "Réparations, installations, urgences 24/7." },
        { icon: "❄️", name: "Déneigement", desc: "Entrées, toitures, stationnements." },
      ],
    },
    how: {
      title: "Comment ça marche",
      stepLabel: "Étape",
      steps: [
        { ic: "📝", t: "Décrivez", d: "Mentionnez vos besoins pour trouver le bon pro." },
        { ic: "🔍", t: "Trouvez", d: "On jumelle le meilleur pro près de chez vous." },
        { ic: "📅", t: "Réservez", d: "Réservez votre créneau en quelques clics." },
        { ic: "💰", t: "Payez", d: "Payez en ligne de façon sécurisée via Stripe." },
      ],
    },
    wa: {
      title: "Parlez à Max sur WhatsApp",
      sub: "Notre concierge IA vous trouve un pro en moins de 5 minutes.",
      cta: "Envoyer un message à Max",
      msgs: [
        { r: "u", t: "Salut Max, j'ai besoin d'un plombier à Longueuil" },
        { r: "b", t: "Envoye! 🔧 J'ai 3 plombiers vérifiés disponibles. Voici le meilleur :" },
        { r: "b", t: "👷 Jean T. — 4.9⭐ — 45$/h — 2.1 km\n📅 Disponible demain 9h-12h\n\n[Confirmer]  [Voir d'autres]" },
        { r: "u", t: "Confirmer" },
        { r: "b", t: "✅ C'est booké! Jean sera chez vous demain à 9h. Vous recevrez un rappel ce soir. 🍯" },
      ],
      online: "En ligne",
    },
    pro: {
      title: "Vous êtes un professionnel ?",
      sub: "Rejoignez Q-emplois et recevez des mandats près de chez vous.",
      perks: [
        "Recevez des demandes directement sur WhatsApp",
        "Paiements sécurisés via Stripe — fini le cash",
        "Tableau de bord L'Atelier : revenus, TPS/TVQ, calendrier",
        "Badge « Vérifié » avec votre licence provinciale",
      ],
      cta: "S'inscrire comme prestataire",
      sub2: "Gratuit — aucun frais jusqu'à votre premier mandat",
    },
    foot: {
      tag: "Le bon pro, au bon moment — fait au Québec.",
      legal: "Conforme à la Loi 96 (langue) et la Loi 25 (vie privée).",
      copy: "© 2026 Q-emplois. Tous droits réservés.",
    },
  },
  en: {
    nav: { find: "Find a Pro", become: "Become a Pro", login: "Log in", signup: "Sign up" },
    hero: {
      h1: "The right pro, at the right time.",
      sub: "Find reliable help for all your tasks in Québec.",
      ph: "What do you need done?",
      cta: "Book now",
    },
    cats: {
      title: "Our services",
      items: [
        { icon: "🧹", name: "Housekeeping", desc: "Find help for your household tasks." },
        { icon: "🔧", name: "Repairs", desc: "Reliable help for all repairs in Québec." },
        { icon: "🚚", name: "Moving", desc: "Moving, storage, transportation." },
        { icon: "⚡", name: "Electrical", desc: "Panels, outlets, lighting — licence verified." },
        { icon: "🔨", name: "Plumbing", desc: "Repairs, installations, 24/7 emergencies." },
        { icon: "❄️", name: "Snow Removal", desc: "Driveways, roofs, parking lots." },
      ],
    },
    how: {
      title: "How it works",
      stepLabel: "Step",
      steps: [
        { ic: "📝", t: "Describe", d: "Tell us what you need to find the right pro." },
        { ic: "🔍", t: "Find", d: "We match the best pro near you." },
        { ic: "📅", t: "Book", d: "Reserve your time slot in a few clicks." },
        { ic: "💰", t: "Pay", d: "Pay securely online via Stripe." },
      ],
    },
    wa: {
      title: "Talk to Max on WhatsApp",
      sub: "Our AI concierge finds you a pro in under 5 minutes.",
      cta: "Message Max",
      msgs: [
        { r: "u", t: "Hey Max, I need a plumber in Longueuil" },
        { r: "b", t: "Let's go! 🔧 I've got 3 verified plumbers. Here's the best match:" },
        { r: "b", t: "👷 Jean T. — 4.9⭐ — $45/h — 2.1 km\n📅 Available tomorrow 9am-12pm\n\n[Confirm]  [See others]" },
        { r: "u", t: "Confirm" },
        { r: "b", t: "✅ Booked! Jean will be at your place tomorrow at 9am. You'll get a reminder tonight. 🍯" },
      ],
      online: "Online",
    },
    pro: {
      title: "Are you a professional?",
      sub: "Join Q-emplois and get jobs near you.",
      perks: [
        "Receive requests directly on WhatsApp",
        "Secure payments via Stripe — no more cash",
        "L'Atelier dashboard: revenue, GST/QST, calendar",
        '"Verified" badge with your provincial licence',
      ],
      cta: "Sign up as a provider",
      sub2: "Free — no fees until your first job",
    },
    foot: {
      tag: "The right pro, at the right time — made in Québec.",
      legal: "Compliant with Bill 96 (language) and Law 25 (privacy).",
      copy: "© 2026 Q-emplois. All rights reserved.",
    },
  },
};

/* ─── LOGO COMPONENT ─── */
const Logo = ({ size = "md" }: { size?: "lg" | "md" | "sm" }) => {
  const sz = { lg: "text-3xl", md: "text-xl", sm: "text-base" }[size];
  return (
    <span className={`${sz} tracking-wide`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
      <span style={{ color: "#D9B38C", fontWeight: 700 }}>Q</span>
      <span style={{ color: "#B87B44", fontSize: "0.75em", verticalAlign: "middle" }}>⚜</span>
      <span style={{ color: "#D9B38C", fontStyle: "italic", fontWeight: 400 }}>emplois</span>
    </span>
  );
};

/* ─── WHATSAPP ICON ─── */
const WaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── MAIN COMPONENT ─── */
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

  return (
    <div style={{ background: "#1F2F3F", minHeight: "100vh", color: "#D9B38C" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }

        /* ── LEATHER TEXTURE ── */
        .leather {
          background-color: #1F2F3F;
          background-image:
            radial-gradient(ellipse at 30% 30%, rgba(184,123,68,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 70%, rgba(184,123,68,0.03) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }

        /* ── STITCHING ── */
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

        /* ── GOLD BUTTON ── */
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

        /* ── WHATSAPP BUTTON ── */
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

        /* ── SERVICE ICON CIRCLE ── */
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

        /* ── STEP CIRCLE ── */
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

        /* ── CHAT BUBBLE ANIMATION ── */
        .chat-in {
          animation: chatSlide 0.4s ease-out forwards;
          opacity: 0;
        }
        @keyframes chatSlide {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── DIVIDER ── */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(217,179,140,0.15), transparent);
        }

        /* ── UTILITIES ── */
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
      `}</style>

      {/* ════════════════ NAVBAR ════════════════ */}
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

      {/* ════════════════ HERO ════════════════ */}
      <section className="leather" style={{ paddingTop: 120, paddingBottom: 80 }}>
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
            }}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "14px 18px", gap: 10 }}>
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
            <Link to="/contrats" className="gold-btn" style={{ margin: 6, padding: "12px 24px", fontSize: 15, whiteSpace: "nowrap" }}>
              {t.hero.cta}
            </Link>
          </div>
        </div>
      </section>

      <div className="stitch-h" style={{ maxWidth: 1100, margin: "0 auto" }} />

      {/* ════════════════ SERVICES ════════════════ */}
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

      {/* ════════════════ HOW IT WORKS ════════════════ */}
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

      {/* ════════════════ WHATSAPP / MAX ════════════════ */}
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
                  🤖
                </div>
                <div>
                  <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: "#E8CDB0" }}>
                    Max (Ti-Guy)
                  </div>
                  <div style={{ fontSize: 11, color: "#4ade80" }}>● {t.wa.online}</div>
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

      {/* ════════════════ PROVIDER CTA ════════════════ */}
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
                  <span style={{ color: "#B87B44", fontSize: 16, marginTop: 2 }}>⚡</span>
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

      {/* ════════════════ FOOTER ════════════════ */}
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
