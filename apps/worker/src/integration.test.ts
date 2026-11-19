/**
 * End-to-end against a real Postgres: three weekly runs, cross-posting, expiry, curator link, report closed.
 * Runs only when TEST_DATABASE_URL points at a database with migrations 001 + 002 applied.
 *   TEST_DATABASE_URL=postgres://postgres@localhost:5432/agre_test npx vitest run integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RawListing } from '@agre/core';

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)('pipeline against Postgres', async () => {
  const db = await import('@agre/db');
  const { processListing, emptyStats } = await import('./pipeline/process');
  const { curatorSubmissionToRaw } = await import('@agre/core');
  const pool = db.getPool();

  const greenhouse = (id: string, title: string, loc = 'Ayvalık, Balıkesir'): RawListing => ({
    source: 'ats', externalId: `greenhouse:ege:${id}`, url: `https://boards.greenhouse.io/ege/jobs/${id}?gh_src=x`,
    title, company: 'Ege Zeytin A.Ş.', locationText: loc, organizationId: orgId, addedBy: 'pipeline',
  });
  let orgId = '';

  async function weeklyRun(listings: RawListing[]) {
    const run = await db.startRun('manual');
    const stats = emptyStats();
    for (const l of listings) await processListing(l, 'greenhouse:ege', run.id, stats);
    await db.recordSourceRun(run.id, 'ats', 'greenhouse:ege', true, listings.length);
    await db.applyExpiry(run.id, run.started_at);
    await db.finishRun(run.id, 'succeeded', stats);
    return stats;
  }
  const statusOf = async (title: string) =>
    (await pool.query<{ status: string }>('select status from jobs where title = $1', [title])).rows[0]?.status;

  beforeAll(async () => {
    await pool.query(`truncate jobs, job_sources, curation_queue, raw_listings, source_runs, ingestion_runs, job_clicks, job_reports, organizations cascade`);
    await pool.query(`update sources set terms_reviewed_at = now(), enabled = true where key = 'ats'`);
    const { rows } = await pool.query<{ id: string }>(
      `insert into organizations (slug, name, ats_provider, ats_token, sector, subsector, any_role)
       values ('ege-zeytin', 'Ege Zeytin A.Ş.', 'greenhouse', 'ege', 'food-production-brands', 'olive-oil', true) returning id`);
    orgId = rows[0]!.id;
  });
  afterAll(async () => { await db.closePool(); });

  it('run 1 creates jobs; a repeat run creates no duplicates', async () => {
    const s1 = await weeklyRun([greenhouse('1', 'Zeytinyağı Ar-Ge Uzmanı'), greenhouse('2', 'Finance Manager')]);
    expect(s1.created).toBe(2);
    const s2 = await weeklyRun([greenhouse('1', 'Zeytinyağı Ar-Ge Uzmanı'), greenhouse('2', 'Finance Manager')]);
    expect(s2).toMatchObject({ created: 0, updated: 2 });
    expect((await pool.query('select count(*)::int n from jobs')).rows[0].n).toBe(2);
  });

  it('a curator-added LinkedIn copy of the same role is merged, not duplicated', async () => {
    const stats = emptyStats();
    await processListing(curatorSubmissionToRaw({
      url: 'https://www.linkedin.com/jobs/view/zeytinyagi-ar-ge-uzmani-4012345678/?trk=x',
      title: 'Zeytinyağı AR-GE Uzmanı (K/E)', company: 'EGE ZEYTİN', location: 'Ayvalık', curatorId: 'curator-1',
    }), '*', null, stats);
    expect(stats.merged).toBe(1);
    const { rows } = await pool.query(`select original_platform from job_sources js join jobs j on j.id = js.job_id
      where j.title = 'Zeytinyağı Ar-Ge Uzmanı' order by original_platform`);
    expect(rows.map((r) => r.original_platform)).toEqual(['company_site', 'linkedin']);
  });

  it('missing from the board: stale after one run, expired after two (Finance Manager)', async () => {
    await weeklyRun([greenhouse('1', 'Zeytinyağı Ar-Ge Uzmanı')]);
    expect(await statusOf('Finance Manager')).toBe('stale');
    await weeklyRun([greenhouse('1', 'Zeytinyağı Ar-Ge Uzmanı')]);
    expect(await statusOf('Finance Manager')).toBe('expired');
    expect(await statusOf('Zeytinyağı Ar-Ge Uzmanı')).toBe('active');
  });

  it('a failed run never expires anything', async () => {
    const run = await db.startRun('manual');
    await db.recordSourceRun(run.id, 'ats', 'greenhouse:ege', false, 0, 'HTTP 503');
    await db.applyExpiry(run.id, run.started_at);
    expect(await statusOf('Zeytinyağı Ar-Ge Uzmanı')).toBe('active');
  });

  it('two "Report closed" clicks from different sessions close the job', async () => {
    const { rows } = await pool.query<{ id: string }>(`select id from jobs where title = 'Zeytinyağı Ar-Ge Uzmanı'`);
    const id = rows[0]!.id;
    expect((await db.reportClosed(id, 'sess-a')).closed).toBe(false);
    expect((await db.reportClosed(id, 'sess-a')).closed).toBe(false); // same session counts once
    expect((await db.reportClosed(id, 'sess-b')).closed).toBe(true);
  });

  it('visibleJobs exposes the primary external URL and source for the card', async () => {
    await weeklyRun([greenhouse('3', 'Gıda Mühendisi (Kalite)')]);
    const visible = await db.visibleJobs();
    const job = visible.find((v) => v.title === 'Gıda Mühendisi (Kalite)');
    expect(job).toMatchObject({ primary_platform: 'company_site', primary_url: 'https://boards.greenhouse.io/ege/jobs/3?gh_src=x' });
  });
});
