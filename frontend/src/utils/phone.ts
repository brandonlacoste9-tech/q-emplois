/** Normalize Quebec phone to E.164 digits expected by backend (e.g. 5141234567). */
export function normalizeCanadianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizeCanadianPhone(phone);
  if (d.length !== 10) return phone;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
