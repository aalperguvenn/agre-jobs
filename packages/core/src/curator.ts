import { createHash } from 'node:crypto';
import { SECTORS, type PlatformKey } from '@agre/taxonomy';
import { canonicalizeJobUrl } from './canonical-url';
import type { RawListing, SourceKey } from './types';

/**
 * The four platforms that are curator-only (no automated access permitted).
 * Search URL patterns open the platform's own search for a human; the pipeline never requests them.
 * Verify each template once by hand when it changes on the platform side.
 */
export const CURATED_PLATFORMS = {
  linkedin: {
    label: 'LinkedIn',
    search: (q: string) => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=${enc('Türkiye')}&f_TPR=r604800`,
  },
  kariyer_net: {
    label: 'Kariyer.net',
    search: (q: string) => `https://www.kariyer.net/is-ilanlari?kw=${enc(q)}`,
  },
  yenibiris: {
    label: 'YeniBirİş',
    search: (q: string) => `https://www.yenibiris.com/is-ilanlari?q=${enc(q)}`,
  },
  indeed: {
    label: 'Indeed',
    search: (q: string) => `https://tr.indeed.com/jobs?q=${enc(q)}&fromage=7`,
  },
} as const satisfies Partial<Record<PlatformKey, { label: string; search: (q: string) => string }>>;

export type CuratedPlatform = keyof typeof CURATED_PLATFORMS;

const enc = encodeURIComponent;

export interface SavedSearch {
  sectorId: string;
  subsectorId: string;
  label: string;
  query: string;
  links: { platform: CuratedPlatform; label: string; url: string }[];
}

/**
 * Weekly curator checklist: one saved search per subsector (its first Turkish keyword and first
 * English keyword), with a link per platform. Sent in the Monday digest email and shown in /curate.
 */
export function buildSavedSearches(locale: 'tr' | 'en' = 'tr'): SavedSearch[] {
  const out: SavedSearch[] = [];
  for (const sector of SECTORS) {
    for (const sub of sector.subsectors) {
      for (const query of [sub.keywordsTr[0], sub.keywordsEn[0]].filter((q): q is string => Boolean(q))) {
        out.push({
          sectorId: sector.id,
          subsectorId: sub.id,
          label: sub.label[locale],
          query,
          links: (Object.keys(CURATED_PLATFORMS) as CuratedPlatform[]).map((p) => ({
            platform: p,
            label: CURATED_PLATFORMS[p].label,
            url: CURATED_PLATFORMS[p].search(query),
          })),
        });
      }
    }
  }
  return out;
}

export interface CuratorSubmission {
  url: string;
  title: string;
  company: string;
  location: string;
  employment?: string;
  postedAt?: string;
  validThrough?: string;
  note?: string;
  curatorId: string;
}

export class CuratorSubmissionError extends Error {}

/**
 * Turn the curator inbox form into a RawListing. Only URL + fields the curator typed are used;
 * the posting page itself is never fetched.
 */
export function curatorSubmissionToRaw(sub: CuratorSubmission): RawListing {
  let canon;
  try {
    canon = canonicalizeJobUrl(sub.url);
  } catch {
    throw new CuratorSubmissionError('Not a valid URL');
  }
  if (!sub.title.trim() || !sub.company.trim() || !sub.location.trim()) {
    throw new CuratorSubmissionError('Title, company and location are required');
  }
  const source: SourceKey = (['linkedin', 'kariyer_net', 'yenibiris', 'indeed'] as const).includes(canon.platform as CuratedPlatform)
    ? (canon.platform as SourceKey)
    : 'employer_feed';

  return {
    source,
    externalId: canon.platformJobId ?? sha1(canon.canonicalUrl),
    url: sub.url,
    title: sub.title,
    company: sub.company,
    locationText: sub.location,
    employmentHint: sub.employment,
    postedAt: sub.postedAt ?? new Date().toISOString().slice(0, 10),
    validThrough: sub.validThrough,
    descriptionHtml: sub.note,
    addedBy: sub.curatorId,
  };
}

export function sha1(s: string): string {
  return createHash('sha1').update(s).digest('hex');
}
