import { describe, expect, it, vi } from 'vitest';
import { normalizeListing } from '@agre/core';
import type { OrgRow } from '@agre/db';

vi.mock('@agre/db', () => ({}));  // pure functions only; no database in unit tests

const { parseJobPostingJsonLd, parseAgreFeed } = await import('./sources/employer-feed');
const { publishContext } = await import('./pipeline/process');
const { popularSynonyms } = await import('./pipeline/search-index');

const org = (over: Partial<OrgRow> = {}): OrgRow => ({
  id: 'org-1', name: 'Ege Zeytin', ats_provider: null, ats_token: null, feed_url: null,
  sector: 'food-production-brands', subsector: 'olive-oil', any_role: true, ...over,
});

describe('employer feed parsing', () => {
  it('reads schema.org JobPosting inside @graph', () => {
    const html = `<html><head><script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: 'Ege Zeytin' },
        { '@type': 'JobPosting', title: 'Zeytinyağı Tadım Uzmanı', url: 'https://egezeytin.com/kariyer/12',
          datePosted: '2026-11-10', validThrough: '2026-12-31T00:00', employmentType: 'FULL_TIME',
          hiringOrganization: { name: 'Ege Zeytin A.Ş.' },
          jobLocation: { '@type': 'Place', address: { addressLocality: 'Ayvalık', addressRegion: 'Balıkesir', addressCountry: 'TR' } } },
      ],
    })}</script></head></html>`;
    const [job] = parseJobPostingJsonLd(html, 'https://egezeytin.com/kariyer', org());
    expect(job).toMatchObject({
      title: 'Zeytinyağı Tadım Uzmanı', company: 'Ege Zeytin A.Ş.', postedAt: '2026-11-10',
      validThrough: '2026-12-31', locationText: 'Ayvalık, Balıkesir, TR', source: 'employer_feed',
    });
  });

  it('reads the Agre JSON feed', () => {
    const jobs = parseAgreFeed(JSON.stringify({ jobs: [{ id: '7', title: 'Sezonluk Hasat Sorumlusu', url: 'https://x.com/7', location: 'Ordu' }] }), org());
    expect(jobs[0]).toMatchObject({ externalId: 'org-1:7', company: 'Ege Zeytin' });
  });
});

describe('publish rules', () => {
  const raw = (over = {}) => ({ source: 'careerjet' as const, externalId: '1', url: 'https://cj.com/x', company: 'Acme', locationText: 'İzmir', addedBy: 'pipeline', ...over });

  it('skips off-taxonomy search results', () => {
    expect(publishContext(normalizeListing({ ...raw(), title: 'Java Developer' }))).toBe('skip');
  });
  it('publishes on-taxonomy search results', () => {
    expect(publishContext(normalizeListing({ ...raw(), title: 'Ar-Ge Şefi' }))).toMatchObject({ status: 'active', needsReview: null });
  });
  it('never rejects a curator pick; sends it to review instead', () => {
    const n = normalizeListing({ ...raw({ source: 'linkedin', url: 'https://linkedin.com/jobs/view/4012345678', addedBy: 'u1' }), title: 'Operations Lead' });
    expect(publishContext(n)).toMatchObject({ status: 'active', needsReview: 'low_confidence' });
  });
  it('any_role organizations list every role under their own sector', () => {
    const n = normalizeListing({ ...raw({ source: 'ats', url: 'https://boards.greenhouse.io/ege/jobs/1', organizationId: 'org-1' }), title: 'Finance Manager' });
    expect(publishContext(n, org())).toMatchObject({ status: 'active', sector: 'food-production-brands' });
    expect(publishContext(n, org({ any_role: false }))).toBe('skip');
  });
  it('flags unknown locations for review', () => {
    const n = normalizeListing({ ...raw({ locationText: 'Springfield' }), title: 'Food Scientist' });
    expect(publishContext(n)).toMatchObject({ needsReview: 'unknown_location' });
  });
});

describe('search synonyms', () => {
  it('maps each Popüler label to Turkish titles and back', () => {
    const syn = popularSynonyms();
    expect(syn['r&d chef']).toContain('ar-ge şefi');
    expect(syn['ar-ge şefi']).toContain('r&d chef');
    expect(Object.keys(syn)).toContain('food scientist');
  });
});
