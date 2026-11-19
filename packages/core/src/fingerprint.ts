import { createHash } from 'node:crypto';
import { fold, normalizeCompany } from './text';

/**
 * Cross-source identity of a job: SHA-256 of normalized company + normalized title + place.
 * Place is the province when known, else the folded city, else "remote"/"unknown".
 */
export function jobFingerprint(input: { company: string; title: string; province?: string; city?: string; remote?: boolean }): string {
  const place = input.province ? fold(input.province) : input.city ? fold(input.city) : input.remote ? 'remote' : 'unknown';
  const key = [normalizeCompany(input.company), normalizeTitle(input.title), place].join('|');
  return createHash('sha256').update(key).digest('hex');
}

/** Titles vary in gender markers and seniority noise across Turkish boards; strip those. */
export function normalizeTitle(title: string): string {
  return fold(title)
    .replace(/\b(m w d|m f d|k e|kadin erkek|bay bayan|e k)\b/g, ' ')
    .replace(/\b(acil|urgent|yeni|new)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trigram similarity (same idea as pg_trgm), for the near-duplicate check on small candidate sets. */
export function trigramSimilarity(a: string, b: string): number {
  const grams = (s: string) => {
    const t = `  ${normalizeTitle(s)} `;
    const set = new Set<string>();
    for (let i = 0; i < t.length - 2; i++) set.add(t.slice(i, i + 3));
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  A.forEach((g) => { if (B.has(g)) inter++; });
  return inter / (A.size + B.size - inter || 1);
}
