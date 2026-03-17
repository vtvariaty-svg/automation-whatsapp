/**
 * Normalizes a phone number to E.164 format (+55DDNNNNNNNNN).
 * Returns null when the input is too short or unparseable.
 *
 * Rules applied (Brazil-centric, safe for international):
 * - Strip everything except digits and leading +
 * - If already starts with + keep as-is
 * - If starts with 55 and has 12-13 digits → prefix +
 * - Otherwise prefix +55 (Brazil default)
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Remove spaces, dashes, parentheses, dots
  let digits = raw.replace(/[^\d+]/g, '');

  if (!digits) return null;

  // Already E.164
  if (digits.startsWith('+')) {
    return digits.length >= 8 ? digits : null;
  }

  // Strip leading zeros (common in local formats)
  digits = digits.replace(/^0+/, '');

  if (!digits) return null;

  // If starts with country code 55 and total length is 12 or 13 → Brazil with country code
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }

  // Brazilian number without country code: 10 or 11 digits
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // Generic international (10-15 digits)
  if (digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
