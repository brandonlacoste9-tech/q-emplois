/** Normalize Canadian phone numbers to E.164 (+15141234567). */
export function normalizePhone(value: string | undefined | null): string | undefined {
  if (!value?.trim()) return undefined;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (value.startsWith('+')) return value;
  return value;
}

export function phoneToWhatsappId(phone: string): string {
  if (phone.startsWith('whatsapp:')) return phone;
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error('Invalid phone');
  return `whatsapp:${normalized}`;
}

export function whatsappIdToPhone(whatsappId: string): string {
  return whatsappId.replace(/^whatsapp:/, '');
}
