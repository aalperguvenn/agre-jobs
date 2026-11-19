import type { RawListing } from '@agre/core';
import type { OrgRow } from '@agre/db';
import { politeFetch } from '../http';
import type { ScopeResult, SourceAdapter } from './types';

/**
 * Public job-board APIs that ATS vendors publish so job boards can show an employer's roles.
 * Only organizations in our directory that gave us their board token (organizations.ats_token) are read.
 *   Greenhouse  GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 *   Lever       GET https://api.lever.co/v0/postings/{site}?mode=json   (EU: api.eu.lever.co)
 *   Ashby       GET https://api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=true
 */
export const ats: SourceAdapter = {
  key: 'ats',
  async discover(ctx) {
    const results: ScopeResult[] = [];
    for (const org of ctx.atsOrgs) {
      const scope = `${org.ats_provider}:${org.ats_token}`;
      try {
        const listings = await fetchBoard(org);
        results.push({ scope, ok: true, listings });
      } catch (err) {
        ctx.log('ats board failed', { scope, error: String(err) });
        results.push({ scope, ok: false, listings: [], error: String(err) });
      }
    }
    return results;
  },
};

async function getJson<T>(url: string): Promise<T> {
  const res = await politeFetch(url, { minIntervalMs: 500 });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return (await res.json()) as T;
}

async function fetchBoard(org: OrgRow): Promise<RawListing[]> {
  const token = encodeURIComponent(org.ats_token!);
  const base = { source: 'ats' as const, company: org.name, organizationId: org.id, addedBy: 'pipeline' };

  switch (org.ats_provider) {
    case 'greenhouse': {
      const data = await getJson<{ jobs: {
        id: number; title: string; absolute_url: string; location?: { name?: string }; updated_at?: string;
        first_published?: string; content?: string;
      }[] }>(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
      return data.jobs.map((j) => ({
        ...base, externalId: `greenhouse:${org.ats_token}:${j.id}`, url: j.absolute_url, title: j.title,
        locationText: j.location?.name, descriptionHtml: j.content,
        postedAt: (j.first_published ?? j.updated_at)?.slice(0, 10), payload: j,
      }));
    }
    case 'lever':
    case 'lever_eu': {
      const host = org.ats_provider === 'lever_eu' ? 'api.eu.lever.co' : 'api.lever.co';
      const data = await getJson<{
        id: string; text: string; hostedUrl: string; applyUrl?: string; createdAt?: number; descriptionPlain?: string;
        workplaceType?: string; categories?: { location?: string; commitment?: string; allLocations?: string[] };
      }[]>(`https://${host}/v0/postings/${token}?mode=json`);
      return data.map((j) => ({
        ...base, externalId: `lever:${org.ats_token}:${j.id}`, url: j.hostedUrl, applyUrl: j.applyUrl, title: j.text,
        locationText: j.categories?.location ?? j.categories?.allLocations?.join(', '),
        employmentHint: j.categories?.commitment, remoteHint: j.workplaceType === 'remote',
        descriptionHtml: j.descriptionPlain, postedAt: j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : undefined,
        payload: j,
      }));
    }
    case 'ashby': {
      const data = await getJson<{ jobs: {
        id?: string; title: string; jobUrl: string; applyUrl?: string; location?: string; employmentType?: string;
        isRemote?: boolean; publishedAt?: string; descriptionPlain?: string; isListed?: boolean;
      }[] }>(`https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`);
      return data.jobs.filter((j) => j.isListed !== false).map((j) => ({
        ...base, externalId: `ashby:${org.ats_token}:${j.id ?? j.jobUrl}`, url: j.jobUrl, applyUrl: j.applyUrl,
        title: j.title, locationText: j.location, employmentHint: j.employmentType, remoteHint: j.isRemote,
        descriptionHtml: j.descriptionPlain, postedAt: j.publishedAt?.slice(0, 10), payload: j,
      }));
    }
    default:
      throw new Error(`Unsupported ATS provider ${org.ats_provider}`);
  }
}
