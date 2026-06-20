/**
 * Québec emplois design tokens — keep in sync with `theme.css` :root variables.
 * Import these in TS/TSX instead of hard-coding hex colors.
 */
export const colors = {
  bg: '#1F2F3F',
  bgDeep: '#152332',
  cream: '#D9B38C',
  creamHi: '#E8CDB0',
  gold: '#B87B44',
  goldLo: '#8B5E30',
  muted: '#C4A882',
  muted2: '#9A8468',
  /** Text/icons on gold backgrounds */
  onGold: '#1F2F3F',
} as const;

export const fonts = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Lora', Georgia, serif",
} as const;

export const gradients = {
  gold: `linear-gradient(145deg, ${colors.gold}, ${colors.goldLo})`,
  goldBtn: 'linear-gradient(180deg, #C88B54, #A06A38)',
  goldBtnHover: 'linear-gradient(180deg, #D49B64, #B07A48)',
} as const;

export const alpha = {
  stitchBorder: 'rgba(217,179,140,0.35)',
  stitchBorderStrong: 'rgba(217,179,140,0.4)',
  stitchBorderHover: 'rgba(217,179,140,0.55)',
  goldTint: 'rgba(184,123,68,0.15)',
  goldTintLight: 'rgba(184,123,68,0.08)',
  goldTintPanel: 'rgba(184,123,68,0.12)',
  panel: 'rgba(21,35,50,0.6)',
  panelDeep: 'rgba(21,35,50,0.7)',
  navBg: 'rgba(31,47,63,0.92)',
} as const;

/** Shorthand exports for common inline styles */
export const gold = colors.gold;
export const cream = colors.cream;
export const creamHi = colors.creamHi;
export const bg = colors.bg;
export const onGold = colors.onGold;
