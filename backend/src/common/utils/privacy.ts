/** Strip contact/location details from job descriptions shown on the public board. */
export function sanitizePublicDescription(text: string): string {
  let s = text;
  s = s.replace(
    /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    '[contact masqué]',
  );
  s = s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gi, '[courriel masqué]');
  s = s.replace(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/g, '[secteur masqué]');
  s = s.replace(
    /\b\d{1,5}[\s,-]+[\wÀ-ÿ\s.'-]{2,40}(rue|avenue|ave|boulevard|boul|street|st|chemin|ch|route|rang)\b/gi,
    '[adresse masquée]',
  );
  s = s.replace(/\b(app\.?|apt\.?|unité|#)\s*\d+\b/gi, '[unité masquée]');
  return s;
}

export function publicPostalSector(postalCode?: string | null): string {
  const fsa = postalCode?.replace(/\s/g, '').toUpperCase().slice(0, 3);
  return fsa ? `Secteur ${fsa}` : '';
}
