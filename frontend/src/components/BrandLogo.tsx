/* Shared Q-emplois wordmark — matches the homepage logo. */
export const BrandLogo = ({ size = "md" }: { size?: "lg" | "md" | "sm" }) => {
  const sz = { lg: "text-3xl", md: "text-xl", sm: "text-base" }[size];
  return (
    <span className={`${sz} tracking-wide`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
      <span style={{ color: "#D9B38C", fontWeight: 700 }}>Q</span>
      <span style={{ color: "#B87B44", fontSize: "0.75em", verticalAlign: "middle" }}>⚜</span>
      <span style={{ color: "#D9B38C", fontStyle: "italic", fontWeight: 400 }}>emplois</span>
    </span>
  );
};
