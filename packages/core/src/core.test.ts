import { describe, expect, it } from 'vitest';
import { PROVINCE_HUB, POPULAR_TAGS, ALL_SUBSECTORS, SECTORS } from '@agre/taxonomy';
import {
  buildSavedSearches, canonicalizeJobUrl, classifyFunction, classifyListing, computeStatus,
  curatorSubmissionToRaw, decideDedupe, detectEmploymentType, detectWorkMode, fold, jobFingerprint,
  locate, normalizeCompany, normalizeListing, withReferral, type DedupeRepository,
} from '@agre/core';

describe('taxonomy', () => {
  it('has the PRD shape: 10 sectors, 81 provinces', () => {
    expect(SECTORS).toHaveLength(10);
    expect(Object.keys(PROVINCE_HUB)).toHaveLength(81);
    expect(ALL_SUBSECTORS.length).toBeGreaterThanOrEqual(55);
    expect(new Set(ALL_SUBSECTORS.map((s) => s.id)).size).toBe(ALL_SUBSECTORS.length);
  });

  it('Popüler tags are exactly the five labels, in order', () => {
    expect(POPULAR_TAGS.map((t) => t.label)).toEqual([
      'Food Scientist', 'R&D Chef', 'Food Innovation Consultant', 'Culinary Tour Host', 'Food Entrepreneur',
    ]);
  });
});

describe('fold', () => {
  it('handles Turkish casing', () => {
    expect(fold('IĞDIR')).toBe('igdir');
    expect(fold('İzmir')).toBe('izmir');
    expect(fold('Ar-Ge Şefi')).toBe('ar ge sefi');
  });
  it('strips legal suffixes from company names', () => {
    expect(normalizeCompany('Tariş Zeytin ve Zeytinyağı A.Ş.')).toBe('taris zeytin ve zeytinyagi');
    expect(normalizeCompany('Örnek Gıda San. ve Tic. Ltd. Şti.')).toBe('ornek gida');
  });
});

describe('canonicalizeJobUrl', () => {
  it('LinkedIn: slug and currentJobId forms collapse to one URL', () => {
    const a = canonicalizeJobUrl('https://www.linkedin.com/jobs/view/r-d-chef-at-acme-4012345678/?trk=public_jobs&refId=abc');
    const b = canonicalizeJobUrl('https://tr.linkedin.com/jobs/search/?currentJobId=4012345678&keywords=chef');
    expect(a.canonicalUrl).toBe('https://linkedin.com/jobs/view/4012345678');
    expect(b.canonicalUrl).toBe(a.canonicalUrl);
    expect(a.platform).toBe('linkedin');
  });
  it('Indeed keeps only jk', () => {
    const r = canonicalizeJobUrl('https://tr.indeed.com/viewjob?jk=abc123def&from=serp&vjs=3');
    expect(r).toMatchObject({ canonicalUrl: 'https://tr.indeed.com/viewjob?jk=abc123def', platform: 'indeed', platformJobId: 'abc123def' });
  });
  it('Kariyer.net reads the ID from the path', () => {
    const r = canonicalizeJobUrl('https://www.kariyer.net/is-ilani/ornek-gida-ar-ge-sefi-3912345/?utm_source=x');
    expect(r).toMatchObject({ canonicalUrl: 'https://kariyer.net/is-ilani/ornek-gida-ar-ge-sefi-3912345', platform: 'kariyer_net', platformJobId: '3912345' });
  });
  it('company sites drop tracking params and sort the rest', () => {
    const r = canonicalizeJobUrl('https://Careers.Example.com/jobs/42/?utm_campaign=x&b=2&a=1#apply');
    expect(r.canonicalUrl).toBe('https://careers.example.com/jobs/42?a=1&b=2');
    expect(r.platform).toBe('company_site');
  });
  it('adds referral params to company sites only', () => {
    expect(withReferral('https://acme.com/jobs/1', 'company_site')).toContain('utm_source=agrejobs');
    expect(withReferral('https://linkedin.com/jobs/view/1', 'linkedin')).toBe('https://linkedin.com/jobs/view/1');
  });
});

describe('classify', () => {
  it('tags culinary R&D from a Turkish title', () => {
    const c = classifyListing({ title: 'Ar-Ge Şefi', company: 'Örnek Gıda' });
    expect(c).toMatchObject({ sector: 'horeca-gastronomy', subsector: 'culinary-rnd', decision: 'accept' });
  });
  it('tags an English food scientist role', () => {
    const c = classifyListing({ title: 'Senior Food Scientist – Plant-based', company: 'Acme Foods' });
    expect(c.sector).toBe('foodtech');
  });
  it('tags olive oil export to a sensible subsector', () => {
    const c = classifyListing({ title: 'Zeytinyağı İhracat Uzmanı', company: 'Ege Zeytin' });
    expect(['olive-oil', 'export-import']).toContain(c.subsector);
  });
  it('rejects generic retail roles', () => {
    expect(classifyListing({ title: 'Kasiyer (Market)', company: 'Market Zinciri' }).decision).toBe('reject');
  });
  it('rejects off-taxonomy roles', () => {
    expect(classifyListing({ title: 'Senior Java Developer', company: 'Bank' }).decision).toBe('reject');
  });
  it('sends weak matches to review', () => {
    expect(classifyListing({ title: 'Operations Associate', company: 'Kooperatif' }).decision).toBe('review');
  });
  it('detects function', () => {
    expect(classifyFunction('Ziraat Mühendisi (Saha)')).toBe('agronomy-field');
    expect(classifyFunction('R&D Chef')).toBe('culinary');
  });
});

describe('locate', () => {
  it('maps Kariyer.net city forms', () => {
    expect(locate('İstanbul(Asya)')).toMatchObject({ province: 'İstanbul', hub: 'istanbul-marmara' });
  });
  it('maps districts to provinces', () => {
    expect(locate('Bodrum')).toMatchObject({ province: 'Muğla', hub: 'izmir-ege' });
    expect(locate('Alanya, Antalya, Türkiye')).toMatchObject({ province: 'Antalya', hub: 'antalya-akdeniz' });
    expect(locate('Gaziantep')).toMatchObject({ hub: 'guneydogu-gap' });
    expect(locate('Tekirdağ')).toMatchObject({ hub: 'trakya' });
  });
  it('maps regional countries and remote', () => {
    expect(locate('Tbilisi, Georgia')).toMatchObject({ hub: 'caucasus' });
    expect(locate('Girne, KKTC')).toMatchObject({ hub: 'northern-cyprus' });
    expect(locate('Remote')).toMatchObject({ hub: 'remote' });
  });
  it('returns undefined when unsure', () => {
    expect(locate('Springfield')).toBeUndefined();
  });
});

describe('employment and work mode', () => {
  it('reads Turkish contract words', () => {
    expect(detectEmploymentType(undefined, 'Sezonluk Aşçı (Bodrum)')).toBe('seasonal');
    expect(detectEmploymentType('Yarı Zamanlı')).toBe('part_time');
    expect(detectEmploymentType(undefined, 'Gıda Mühendisi Stajyer')).toBe('internship');
    expect(detectEmploymentType(undefined, 'Stage HR Specialist')).toBe('full_time');
  });
  it('reads work mode', () => {
    expect(detectWorkMode({ texts: ['İstanbul (Hibrit)'] })).toBe('hybrid');
    expect(detectWorkMode({ texts: ['Uzaktan'] })).toBe('remote');
  });
});

describe('fingerprint and dedupe', () => {
  it('same job on two boards gets the same fingerprint', () => {
    const a = jobFingerprint({ company: 'Örnek Gıda A.Ş.', title: 'Ar-Ge Şefi (K/E)', province: 'İstanbul' });
    const b = jobFingerprint({ company: 'ORNEK GIDA', title: 'AR-GE ŞEFİ', province: 'istanbul' });
    expect(a).toBe(b);
  });

  const mk = (url: string, source: 'kariyer_net' | 'linkedin' | 'careerjet', externalId: string, title = 'Ar-Ge Şefi') =>
    normalizeListing({ source, externalId, url, title, company: 'Örnek Gıda A.Ş.', locationText: 'İstanbul(Avrupa)' });

  const repoWith = (rows: { id: string; source: string; externalId: string; url: string; print: string; title: string; company: string; province?: string }[]): DedupeRepository => ({
    findJobBySourceExternalId: async (s, e) => rows.find((r) => r.source === s && r.externalId === e)?.id,
    findJobByCanonicalUrl: async (u) => rows.find((r) => r.url === u)?.id,
    findJobByFingerprint: async (f) => rows.find((r) => r.print === f)?.id,
    findCandidates: async (c, p) => rows.filter((r) => r.company === c && r.province === p).map((r) => ({ id: r.id, title: r.title })),
  });

  it('runs the four checks in order', async () => {
    const existing = mk('https://www.kariyer.net/is-ilani/ornek-gida-ar-ge-sefi-3912345', 'kariyer_net', '3912345');
    const repo = repoWith([{ id: 'job-1', source: 'kariyer_net', externalId: '3912345', url: existing.canonicalUrl, print: existing.fingerprint, title: existing.title, company: existing.companyNormalized, province: 'İstanbul' }]);

    expect(await decideDedupe(existing, repo)).toMatchObject({ action: 'update_source', jobId: 'job-1' });

    const sameUrlOtherSource = mk('https://www.kariyer.net/is-ilani/ornek-gida-ar-ge-sefi-3912345/?utm_source=cj', 'careerjet', 'cj-1');
    expect(await decideDedupe(sameUrlOtherSource, repo)).toMatchObject({ action: 'attach_source', reason: 'canonical_url' });

    const crossPost = mk('https://www.linkedin.com/jobs/view/4012345678/', 'linkedin', '4012345678');
    expect(await decideDedupe(crossPost, repo)).toMatchObject({ action: 'attach_source', reason: 'fingerprint', jobId: 'job-1' });

    const near = mk('https://www.linkedin.com/jobs/view/4099999999/', 'linkedin', '4099999999', 'Ar-Ge Şefi Yardımcısı');
    const d = await decideDedupe(near, repo);
    expect(d.action).toBe('create');
  });
});

describe('expiry', () => {
  const now = new Date('2026-12-01');
  it('automated sources go stale then expired', () => {
    const base = { current: 'active' as const, closedReports: 0, now };
    expect(computeStatus({ ...base, sources: [{ accessMode: 'api', missedRuns: 0, addedAt: now }] })).toBe('active');
    expect(computeStatus({ ...base, sources: [{ accessMode: 'api', missedRuns: 1, addedAt: now }] })).toBe('stale');
    expect(computeStatus({ ...base, sources: [{ accessMode: 'api', missedRuns: 2, addedAt: now }] })).toBe('expired');
  });
  it('curated links expire after 30 days unless renewed', () => {
    const old = new Date('2026-10-15');
    const base = { current: 'active' as const, closedReports: 0, now };
    expect(computeStatus({ ...base, sources: [{ accessMode: 'curator_only', missedRuns: 0, addedAt: old }] })).toBe('expired');
    expect(computeStatus({ ...base, sources: [{ accessMode: 'curator_only', missedRuns: 0, addedAt: old, renewedAt: new Date('2026-11-20') }] })).toBe('active');
  });
  it('any live source keeps a cross-posted job active; two reports close it', () => {
    const sources = [{ accessMode: 'api' as const, missedRuns: 3, addedAt: now }, { accessMode: 'curator_only' as const, missedRuns: 0, addedAt: now }];
    expect(computeStatus({ current: 'active', sources, closedReports: 0, now })).toBe('active');
    expect(computeStatus({ current: 'active', sources, closedReports: 2, now })).toBe('closed');
  });
});

describe('curator', () => {
  it('builds weekly saved searches for all four platforms', () => {
    const searches = buildSavedSearches();
    expect(searches.length).toBeGreaterThan(100);
    expect(searches[0]!.links.map((l) => l.label)).toEqual(['LinkedIn', 'Kariyer.net', 'YeniBirİş', 'Indeed']);
  });
  it('turns a curator submission into a raw listing without fetching', () => {
    const raw = curatorSubmissionToRaw({
      url: 'https://tr.indeed.com/viewjob?jk=abc123', title: 'Food Scientist', company: 'Acme',
      location: 'İzmir', curatorId: 'u1',
    });
    expect(raw).toMatchObject({ source: 'indeed', externalId: 'abc123', addedBy: 'u1' });
  });
});
