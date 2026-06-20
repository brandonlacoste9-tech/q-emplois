import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { colors } from "../styles/design-tokens";

type Lang = "fr" | "en";

const NAV = {
  fr: { find: "Trouver de l'aide", become: "Offrir mes services", login: "Connexion", signup: "S'inscrire" },
  en: { find: "Find help", become: "Offer my services", login: "Log in", signup: "Sign up" },
};

/* Shared top navigation bar — matches the homepage navbar.
   Pass the current lang + a toggle so language stays in sync per page. */
export function SiteNav({
  lang,
  onToggleLang,
  fixed = true,
}: {
  lang: Lang;
  onToggleLang: () => void;
  fixed?: boolean;
}) {
  const t = NAV[lang];
  return (
    <nav
      style={{
        position: fixed ? "fixed" : "sticky",
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
          <BrandLogo size="md" />
        </Link>
        <div className="body-f" style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14 }}>
          <Link to="/contrats" className="nav-link nav-hide-sm">{t.find}</Link>
          <Link to="/pro" className="nav-link nav-hide-sm">{t.become}</Link>
          <Link to="/login" className="nav-link">{t.login}</Link>
          <button
            onClick={onToggleLang}
            style={{
              padding: "4px 12px",
              border: "1px dashed rgba(217,179,140,0.35)",
              borderRadius: 6,
              background: "transparent",
              color: colors.cream,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <Link to="/register" className="gold-btn" style={{ padding: "8px 18px", fontSize: 13 }}>
            {t.signup}
          </Link>
        </div>
      </div>
    </nav>
  );
}
