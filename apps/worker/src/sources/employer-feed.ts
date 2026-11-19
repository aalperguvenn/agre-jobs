import { sha1, type RawListing } from '@agre/core';
import type { OrgRow } from '@agre/db';
import { politeFetch } from '../http';
import type { ScopeResult, SourceAdapter } from './types';

/**
 * Opt-in employer feeds (organizations.feed_url + feed_consent_at). Two accepted formats:
 *  1. Agre Jobs JSON feed: { "jobs": [ { id, title, url, location, employment_type, posted_at, valid_through, description } ] }
 *  2. A careers page (or one page per job) with schema.org JobPosting JSON-LD, the format Google Jobs also reads.
 */
export const employerFeed: SourceAdapter = {
  key: 'employer_feed',
  async discover(ctx) {
    const results: ScopeResult[] = [];
    for (const org of ctx.feedOrgs) {
      const scope = `feed:${org.id}`;
      try {
        const res = await politeFetch(org.feed_url!, { minIntervalMs: 1000 });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const listings = (res.headers.get('content-type') ?? '').includes('json')
          ? parseAgreFeed(text, org)
          : parseJobPostingJsonLd(text, org.feed_url!, org);
        results.push({ scope, ok: true, listings });
      } catch (err) {
        ctx.log('employer feed failed', { org: org.name, error: String(err) });
        results.push({ scope, ok: false, listings: [], error: String(err) });
      }
    }
    return results;
  },
};

interface AgreFeedJob {
  id?: string; title: string; url: string; location?: string; employment_type?: string;
  posted_at?: string; valid_through?: string; description?: string; remote?: boolean;
}

export function parseAgreFeed(json: string, org: Pick<OrgRow, 'id' | 'name'>): RawListing[] {
  const data = JSON.parse(json) as { jobs?: AgreFeedJob[] };
  return (data.jobs ?? []).map((j) => ({
    source: 'employer_feed', externalId: `${org.id}:${j.id ?? sha1(j.url)}`, url: j.url, title: j.title,
    company: org.name, organizationId: org.id, locationText: j.location, employmentHint: j.employment_type,
    remoteHint: j.remote, postedAt: j.posted_at, validThrough: j.valid_through, descriptionHtml: j.description,
    addedBy: 'pipeline', payload: j,
  }));
}

type Ld = Record<string, unknown>;

/** Extract every schema.org JobPosting from <script type="application/ld+json"> blocks (incl. @graph and arrays). */
export function parseJobPostingJsonLd(html: string, pageUrl: string, org: Pick<OrgRow, 'id' | 'name'>): RawListing[] {
  const out: RawListing[] = [];
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of blocks) {
    let parsed: unknown;
    try { parsed = JSON.parse(body!.trim()); } catch { continue; }
    for (const node of flatten(parsed)) {
      const type = node['@type'];
      if (!(type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting')))) continue;
      const url = str(node.url) ?? pageUrl;
      const loc = firstLocation(node.jobLocation);
      out.push({
        source: 'employer_feed',
        externalId: `${org.id}:${str((node.identifier as Ld | undefined)?.value) ?? sha1(url + str(node.title))}`,
        url,
        title: str(node.title) ?? 'Untitled',
        company: str((node.hiringOrganization as Ld | undefined)?.name) ?? org.name,
        organizationId: org.id,
        locationText: loc,
        remoteHint: node.jobLocationType === 'TELECOMMUTE',
        employmentHint: Array.isArray(node.employmentType) ? node.employmentType.join(' ') : str(node.employmentType),
        postedAt: str(node.datePosted)?.slice(0, 10),
        validThrough: str(node.validThrough)?.slice(0, 10),
        descriptionHtml: str(node.description),
        addedBy: 'pipeline',
        payload: node,
      });
    }
  }
  return out;
}

function flatten(v: unknown): Ld[] {
  if (Array.isArray(v)) return v.flatMap(flatten);
  if (v && typeof v === 'object') {
    const o = v as Ld;
    return Array.isArray(o['@graph']) ? flatten(o['@graph']) : [o];
  }
  return [];
}
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
function firstLocation(v: unknown): string | undefined {
  const loc = (Array.isArray(v) ? v[0] : v) as Ld | undefined;
  const a = loc?.address as Ld | string | undefined;
  if (typeof a === 'string') return a;
  if (!a) return undefined;
  return [a.addressLocality, a.addressRegion, a.addressCountry].map(str).filter(Boolean).join(', ') || undefined;
}
