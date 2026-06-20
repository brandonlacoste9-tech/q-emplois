// RBQ license number format: 5-digit number, optionally with XXXX-XXXX-XX suffix
// Examples: 1234-5678-90, 12345
const RBQ_PATTERN = /^\d{4,5}(-\d{4}-\d{2})?$/;

export function validateRBQLicense(licenseNumber: string): boolean {
  return RBQ_PATTERN.test(licenseNumber.trim());
}

/** Quebec city prefixes for phone number validation (area codes) */
export const QC_AREA_CODES = [
  '418', '438', '450', '514', '579', '581', '819', '873',
];

export function isQuebecPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return false;
  return QC_AREA_CODES.includes(digits.slice(0, 3));
}