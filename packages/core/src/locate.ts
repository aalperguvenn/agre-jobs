import { COUNTRY_HUB, PLACE_ALIASES, PROVINCE_HUB } from '@agre/taxonomy';
import type { Location } from './types';
import { containsPhrase, fold } from './text';

const PROVINCES = Object.keys(PROVINCE_HUB).map((name) => ({ name, folded: fold(name) }))
  // Longest first so "Kırıkkale" wins over "Kırşehir"-style partials and multi-word names match first.
  .sort((a, b) => b.folded.length - a.folded.length);
const ALIASES = Object.entries(PLACE_ALIASES).map(([alias, province]) => ({ folded: fold(alias), province }))
  .sort((a, b) => b.folded.length - a.folded.length);
const COUNTRIES = Object.entries(COUNTRY_HUB).map(([name, hub]) => ({ folded: fold(name), hub }))
  .sort((a, b) => b.folded.length - a.folded.length);

const REMOTE_WORDS = ['remote', 'uzaktan', 'evden', 'home office', 'anywhere'].map(fold);
const TURKIYE_WORDS = ['turkiye', 'turkey', 'tr'];

/**
 * Map free-text locations ("İstanbul(Asya)", "Bodrum, Muğla", "Tbilisi, Georgia", "Remote")
 * to province → PRD hub, or to a regional hub outside Türkiye. Returns undefined when unsure,
 * which sends the job to the curation queue.
 */
export function locate(text: string | undefined, opts: { remoteHint?: boolean } = {}): Location | undefined {
  if (!text?.trim()) return opts.remoteHint ? { country: 'remote', hub: 'remote' } : undefined;
  const t = fold(text.replace(/\(/g, ' (').replace(/\)/g, ') '));
  const compact = fold(text); // keeps "istanbul asya" style aliases matchable

  const alias = ALIASES.find((a) => containsPhrase(compact, a.folded) || containsPhrase(t, a.folded));
  const province = PROVINCES.find((p) => containsPhrase(t, p.folded));
  const provinceName = province?.name ?? alias?.province;

  if (provinceName) {
    return {
      city: firstSegment(text),
      province: provinceName,
      hub: PROVINCE_HUB[provinceName],
      country: 'turkiye',
    };
  }

  const country = COUNTRIES.find((c) => containsPhrase(t, c.folded));
  if (country) return { city: firstSegment(text), hub: country.hub, country: country.folded };

  if (REMOTE_WORDS.some((w) => containsPhrase(t, w)) || opts.remoteHint) {
    return { country: 'remote', hub: 'remote' };
  }

  if (TURKIYE_WORDS.some((w) => t === w)) return { country: 'turkiye' };
  return undefined;
}

function firstSegment(text: string): string | undefined {
  const seg = text.split(/[,/|-]/)[0]?.replace(/\(.*?\)/g, '').trim();
  return seg || undefined;
}
