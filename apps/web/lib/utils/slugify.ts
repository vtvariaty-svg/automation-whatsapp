/**
 * slugify — normalizes a string into a URL-safe slug.
 * - Lowercase, trim
 * - NFD decompose + strip combining diacritics (accents)
 * - Replace any non-alphanumeric (except hyphen) with hyphen
 * - Collapse consecutive hyphens
 * - Strip leading/trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}
