export const CREDIT_PACKS = {
  starter: { credits: 12, priceCad: 17.99, label: '12 crédits' },
  standard: { credits: 24, priceCad: 34.99, label: '24 crédits' },
  pro: { credits: 60, priceCad: 84.99, label: '60 crédits' },
} as const;

export type CreditPackKey = keyof typeof CREDIT_PACKS;
