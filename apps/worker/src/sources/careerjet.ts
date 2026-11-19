import { canonicalizeJobUrl, sha1, type RawListing } from '@agre/core';
import { politeFetch, USER_AGENT } from '../http';
import type { SourceAdapter } from './types';

/**
 * Careerjet partner API v4 — https://search.api.careerjet.net/v4/query
 * Auth: HTTP Basic, API key as username, empty password. `user_ip` and `user_agent` are required.
 *
 * BEFORE ENABLING (sources.careerjet is seeded disabled):
 *  1. Confirm with Careerjet that a weekly server-side pull, storing results and linking out, is allowed
 *     under the publisher agreement; the API is designed around live end-user searches.
 *  2. Confirm the Türkiye locale code (assumed `tr_TR`; set CAREERJET_LOCALE).
 *  3. Then set sources.terms_reviewed_at and enabled = true.
 */
const ENDPOINT = 'https://search.api.careerjet.net/v4/query';
const PAGE_SIZE = 100;
const MAX_PAGES = Number(process.env.CAREERJET_MAX_PAGES ?? 2);

interface CareerjetJob {
  title: string; company?: string; date?: string; description?: string; locations?: string; url: string;
  salary_min?: number; salary_max?: number; salary_currency_code?: string; salary_type?: 'Y' | 'M' | 'W' | 'D' | 'H';
}
interface CareerjetResponse { type: 'JOBS' | 'LOCATIONS'; hits?: number; pages?: number; jobs?: CareerjetJob[]; message?: string }

const PERIOD = { Y: 'year', M: 'month', W: 'week', D: 'day', H: 'hour' } as const;

export const careerjet: SourceAdapter = {
  key: 'careerjet',
  async discover(ctx) {
    const apiKey = process.env.CAREERJET_API_KEY;
    const serverIp = process.env.CAREERJET_USER_IP;
    if (!apiKey || !serverIp) {
      return [{ scope: '*', ok: false, listings: [], error: 'CAREERJET_API_KEY / CAREERJET_USER_IP not set' }];
    }
    const auth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
    const locale = process.env.CAREERJET_LOCALE ?? 'tr_TR';

    // Query matrix: first 3 Turkish + first 2 English keywords per subsector, country-wide, newest first.
    const queries = [...new Set(ctx.profiles.flatMap((p) => [...p.keywords_tr.slice(0, 3), ...p.keywords_en.slice(0, 2)]))];
    const listings = new Map<string, RawListing>();
    let failures = 0;

    for (const keywords of queries) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const params = new URLSearchParams({
          locale_code: locale, keywords, sort: 'date', page: String(page), page_size: String(PAGE_SIZE),
          fragment_size: '240', user_ip: serverIp, user_agent: USER_AGENT,
        });
        try {
          const res = await politeFetch(`${ENDPOINT}?${params}`, { headers: { authorization: auth }, minIntervalMs: 1100 });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = (await res.json()) as CareerjetResponse;
          if (body.type !== 'JOBS' || !body.jobs?.length) break;
          for (const j of body.jobs) {
            const id = sha1(canonicalizeJobUrl(j.url).canonicalUrl);
            listings.set(id, {
              source: 'careerjet',
              externalId: id,
              url: j.url,
              title: j.title,
              company: j.company ?? 'Unknown',
              locationText: j.locations,
              descriptionHtml: j.description,
              postedAt: j.date ? new Date(j.date).toISOString().slice(0, 10) : undefined,
              salary: j.salary_min || j.salary_max ? {
                min: j.salary_min, max: j.salary_max, currency: j.salary_currency_code,
                period: j.salary_type ? PERIOD[j.salary_type] : undefined,
              } : undefined,
              addedBy: 'pipeline',
              payload: j,
            });
          }
          if (page >= (body.pages ?? 1)) break;
        } catch (err) {
          failures++;
          ctx.log('careerjet query failed', { keywords, page, error: String(err) });
          break;
        }
      }
    }
    // A run with many failed queries is not trusted for expiry (ok=false keeps missed_runs unchanged).
    const ok = failures <= Math.ceil(queries.length * 0.1);
    return [{ scope: '*', ok, listings: [...listings.values()], error: ok ? undefined : `${failures} queries failed` }];
  },
};
