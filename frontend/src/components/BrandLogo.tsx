import { colors, fonts } from '../styles/design-tokens';

/* Shared Québec emplois wordmark — Q expands to Quebec on larger sizes. */
export const BrandLogo = ({ size = "md" }: { size?: "lg" | "md" | "sm" }) => {
  const sz = { lg: "text-3xl", md: "text-xl", sm: "text-base" }[size];
  const spellFull = size === "lg";

  return (
    <span
      className={`${sz} tracking-wide inline-flex items-baseline`}
      style={{ fontFamily: fonts.display }}
    >
      {spellFull ? (
        <span style={{ color: colors.cream, fontWeight: 700 }}>Québec</span>
      ) : (
        <span style={{ color: colors.cream, fontWeight: 700, letterSpacing: "-0.02em" }}>
          <span style={{ fontSize: "1.08em" }}>Q</span>
          <span style={{ fontWeight: 600, fontSize: "0.84em" }}>uebec</span>
        </span>
      )}
      <span style={{ color: colors.gold, fontSize: "0.75em", verticalAlign: "middle", margin: "0 0.06em" }}>⚜</span>
      <span style={{ color: colors.cream, fontStyle: "italic", fontWeight: 400 }}>emplois</span>
    </span>
  );
};
