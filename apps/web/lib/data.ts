import 'server-only';
import { MeiliSearch } from 'meilisearch';
import { fold } from '@agre/core';
import { ALL_SUBSECTORS, POPULAR_TAGS } from '@agre/taxonomy';
import type { JobDoc } from './jobs';
import { DEMO_JOBS } from './demo-jobs';

export const PAGE_SIZE = 20;
export const FILTER_KEYS = ['sector', 'hub', 'employment_type'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export interface SearchInput {
  q?: string;
  filters?: Partial<Record<FilterKey, string>>;
  page?: number;
  limit?: number;
}

/**
 * live:  Meilisearch is configured (production with real data)
 * demo:  no search service AND not the production deployment → labelled sample jobs (previews, local dev)
 * empty: no search service on production → honest "first roles coming soon" state, never fake listings
 */
export type DataMode = 'live' | 'demo' | 'empty';

export interface SearchResult { hits: JobDoc[]; total: number; mode: DataMode }

export function dataMode(): DataMode {
  if (process.env.MEILI_HOST) return 'live';
  if (process.env.VERCEL_ENV === 'production') return 'empty';
  if (process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production' || process.env.AGRE_DEMO_DATA === '1') return 'demo';
  return 'empty';
}

export async function searchJobs(input: SearchInput): Promise<SearchResult> {
  const mode = dataMode();
  const page = Math.max(1, input.page ?? 1);
  const limit = input.limit ?? PAGE_SIZE;
  if (mode === 'live') {
    try {
      return { ...(await searchMeili(input.q ?? '', input.filters ?? {}, page, limit)), mode };
    } catch (err) {
      console.error('[search] Meilisearch unavailable', err);
      return { hits: [], total: 0, mode: 'empty' };
    }
  }
  if (mode === 'demo') return { ...searchDemo(input.q ?? '', input.filters ?? {}, page, limit), mode };
  return { hits: [], total: 0, mode };
}

async function searchMeili(q: string, filters: Partial<Record<FilterKey, string>>, page: number, limit: number) {
  const client = new MeiliSearch({ host: process.env.MEILI_HOST!, apiKey: process.env.MEILI_SEARCH_KEY });
  const filter = FILTER_KEYS.flatMap((k) => (filters[k] ? [`${k} = ${JSON.stringify(filters[k])}`] : []));
  const res = await client.index<JobDoc>(process.env.MEILI_JOBS_INDEX ?? 'jobs').search(q, {
    filter, hitsPerPage: limit, page, sort: q ? undefined : ['posted_at_ts:desc'], locales: ['tur', 'eng'],
  });
  return { hits: res.hits, total: res.totalHits ?? res.hits.length };
}

// ── Demo search: same synonym behaviour as the live index, in memory ──────────
const SUB = new Map(ALL_SUBSECTORS.map((s) => [s.id, s]));
const SYN = new Map(POPULAR_TAGS.map((t) => [fold(t.query), [t.query, ...t.synonyms].map(fold)]));

function searchDemo(q: string, filters: Partial<Record<FilterKey, string>>, page: number, limit: number) {
  const terms = q.trim() ? SYN.get(fold(q)) ?? [fold(q)] : [];
  const matches = DEMO_JOBS.filter((j) => {
    if (FILTER_KEYS.some((k) => filters[k] && (j as unknown as Record<string, unknown>)[k] !== filters[k])) return false;
    if (!terms.length) return true;
    const sub = j.subsector ? SUB.get(j.subsector) : undefined;
    const hay = fold(`${j.title} ${j.company_name} ${sub?.label.tr ?? ''} ${sub?.label.en ?? ''} ${j.city ?? ''}`);
    return terms.some((t) => t.split(' ').every((w) => hay.includes(w)));
  }).sort((a, b) => b.posted_at_ts - a.posted_at_ts);
  return { hits: matches.slice((page - 1) * limit, page * limit), total: matches.length };
}
