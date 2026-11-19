import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { ALL_SUBSECTORS, NEGATIVE_KEYWORDS } from '@agre/taxonomy';
import {
  computeStatus, fold, type AccessMode, type DedupeDecision, type DedupeRepository,
  type NormalizedListing, type RawListing, type SourceKey, type JobStatus,
} from '@agre/core';
import { createHash } from 'node:crypto';

let pool: pg.Pool | undefined;
export function getPool(): pg.Pool {
  pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return pool;
}
export async function closePool() { await pool?.end(); pool = undefined; }

type Q = Pick<pg.Pool, 'query'>;

// ── Sources and organizations ───────────────────────────────────────────────
export interface SourceRow { key: SourceKey; display_name: string; access_mode: AccessMode; terms_reviewed_at: Date | null; enabled: boolean }

/** Automated sources the weekly run may call: enabled AND terms reviewed. Enforced here and by a DB check. */
export async function getRunnableSources(db: Q = getPool()): Promise<SourceRow[]> {
  const { rows } = await db.query<SourceRow>(
    `select * from sources
      where enabled and access_mode in ('api','partner_feed','ats_public') and terms_reviewed_at is not null`,
  );
  return rows;
}

export async function getAccessModes(db: Q = getPool()): Promise<Map<string, AccessMode>> {
  const { rows } = await db.query<{ key: string; access_mode: AccessMode }>('select key, access_mode from sources');
  return new Map(rows.map((r) => [r.key, r.access_mode]));
}

export interface OrgRow {
  id: string; name: string; ats_provider: string | null; ats_token: string | null;
  feed_url: string | null; sector: string | null; subsector: string | null; any_role: boolean;
}
export async function getAtsOrganizations(db: Q = getPool()): Promise<OrgRow[]> {
  const { rows } = await db.query<OrgRow>('select * from organizations where ats_provider is not null and ats_token is not null');
  return rows;
}
export async function getFeedOrganizations(db: Q = getPool()): Promise<OrgRow[]> {
  const { rows } = await db.query<OrgRow>('select * from organizations where feed_url is not null and feed_consent_at is not null');
  return rows;
}
export async function getOrganization(id: string, db: Q = getPool()): Promise<OrgRow | undefined> {
  const { rows } = await db.query<OrgRow>('select * from organizations where id = $1', [id]);
  return rows[0];
}

/** Keep search_profiles in step with @agre/taxonomy (the code is the source of truth). */
export async function syncSearchProfiles(db: Q = getPool()) {
  for (const sub of ALL_SUBSECTORS) {
    await db.query(
      `insert into search_profiles (sector, subsector, keywords_tr, keywords_en, negative_keywords)
       values ($1,$2,$3,$4,$5)
       on conflict (subsector) do update set sector = excluded.sector, keywords_tr = excluded.keywords_tr,
         keywords_en = excluded.keywords_en, negative_keywords = excluded.negative_keywords`,
      [sub.sectorId, sub.id, sub.keywordsTr, sub.keywordsEn, NEGATIVE_KEYWORDS],
    );
  }
}

export interface SearchProfile { sector: string; subsector: string; keywords_tr: string[]; keywords_en: string[]; hubs: string[] }
export async function getSearchProfiles(db: Q = getPool()): Promise<SearchProfile[]> {
  const { rows } = await db.query<SearchProfile>('select * from search_profiles where active order by id');
  return rows;
}

// ── Runs ───────────────────────────────────────────────────────────────────
export async function startRun(trigger: 'cron' | 'manual' | 'curator', db: Q = getPool()) {
  const { rows } = await db.query<{ id: string; started_at: Date }>(
    'insert into ingestion_runs (trigger) values ($1) returning id, started_at', [trigger]);
  return rows[0]!;
}
export async function finishRun(runId: string, status: 'succeeded' | 'partial' | 'failed', stats: object, db: Q = getPool()) {
  await db.query('update ingestion_runs set finished_at = now(), status = $2, stats = $3 where id = $1', [runId, status, stats]);
}
export async function recordSourceRun(
  runId: string, source: SourceKey, scope: string, succeeded: boolean, fetched: number, error?: string, db: Q = getPool(),
) {
  await db.query(
    `insert into source_runs (run_id, source_key, scope, succeeded, fetched, error) values ($1,$2,$3,$4,$5,$6)
     on conflict (run_id, source_key, scope) do update set succeeded = excluded.succeeded, fetched = excluded.fetched, error = excluded.error`,
    [runId, source, scope, succeeded, fetched, error ?? null],
  );
}
export async function recordRaw(runId: string | null, raw: RawListing, db: Q = getPool()) {
  const payload = raw.payload ?? raw;
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  await db.query(
    'insert into raw_listings (run_id, source_key, external_id, url, payload, content_hash) values ($1,$2,$3,$4,$5,$6)',
    [runId, raw.source, raw.externalId, raw.url, payload, hash],
  );
}
export async function purgeRawListings(days = 30, db: Q = getPool()) {
  await db.query(`delete from raw_listings where fetched_at < now() - ($1 || ' days')::interval`, [days]);
}

// ── Dedupe repository ───────────────────────────────────────────────────────
export class PgDedupeRepository implements DedupeRepository {
  constructor(private db: Q = getPool()) {}
  async findJobBySourceExternalId(source: SourceKey, externalId: string) {
    const { rows } = await this.db.query<{ job_id: string }>(
      'select job_id from job_sources where source_key = $1 and external_id = $2', [source, externalId]);
    return rows[0]?.job_id;
  }
  async findJobByCanonicalUrl(url: string) {
    const { rows } = await this.db.query<{ job_id: string }>('select job_id from job_sources where canonical_url = $1', [url]);
    return rows[0]?.job_id;
  }
  async findJobByFingerprint(fp: string) {
    const { rows } = await this.db.query<{ id: string }>(
      `select id from jobs where fingerprint = $1 and status in ('active','stale') order by first_seen_at limit 1`, [fp]);
    return rows[0]?.id;
  }
  async findCandidates(company: string, province?: string) {
    const { rows } = await this.db.query<{ id: string; title: string }>(
      `select id, title from jobs where company_normalized = $1 and province is not distinct from $2
         and status in ('active','stale') limit 50`, [company, province ?? null]);
    return rows;
  }
}

// ── Upsert ─────────────────────────────────────────────────────────────────
export interface UpsertContext {
  scope: string;
  /** Classification outcome after organization rules (see worker/pipeline/process.ts). */
  status: Extract<JobStatus, 'active' | 'rejected'>;
  needsReview: 'low_confidence' | 'unknown_location' | null;
  sector?: string | null;
  subsector?: string | null;
}

export async function applyDecision(
  n: NormalizedListing, decision: DedupeDecision, ctx: UpsertContext, db: Q = getPool(),
): Promise<{ jobId: string; created: boolean }> {
  const r = n.raw;
  if (decision.action === 'update_source') {
    await db.query(
      `update job_sources set last_seen_at = now(), missed_runs = 0, url = $3, apply_url = coalesce($4, apply_url)
        where source_key = $1 and external_id = $2`,
      [r.source, r.externalId, r.url, r.applyUrl ?? null]);
    await touchJob(decision.jobId, n, db);
    return { jobId: decision.jobId, created: false };
  }
  if (decision.action === 'attach_source') {
    if (decision.reason === 'canonical_url') {
      // Same posting reached through another channel: count it as a sighting (renews curated links too).
      await db.query(
        'update job_sources set last_seen_at = now(), missed_runs = 0, renewed_at = now() where canonical_url = $1',
        [n.canonicalUrl]);
    } else {
      await insertJobSource(decision.jobId, n, ctx.scope, false, db);
    }
    await touchJob(decision.jobId, n, db);
    return { jobId: decision.jobId, created: false };
  }

  // create
  const slug = makeSlug(n);
  const { rows } = await db.query<{ id: string }>(
    `insert into jobs (slug, title, company_name, company_normalized, organization_id, sector, subsector, function,
        employment_type, work_mode, city, province, hub, country, salary_min, salary_max, salary_currency, salary_period,
        description_snippet, posted_at, valid_through, status, review_state, fingerprint, classifier_confidence,
        classifier_matched, is_native)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
     returning id`,
    [slug, n.title, n.companyName, n.companyNormalized, r.organizationId ?? null,
      ctx.sector ?? n.classification.sector ?? null, ctx.subsector ?? n.classification.subsector ?? null, n.function ?? null,
      n.employmentType, n.workMode, n.location?.city ?? null, n.location?.province ?? null, n.location?.hub ?? null,
      n.location?.country ?? null, r.salary?.min ?? null, r.salary?.max ?? null, r.salary?.currency ?? null,
      r.salary?.period ?? null, n.descriptionSnippet ?? null, r.postedAt ?? null, r.validThrough ?? null, ctx.status,
      ctx.needsReview || decision.reviewDuplicateOf ? 'pending' : 'none', n.fingerprint, n.classification.confidence,
      n.classification.matched, r.source === 'native'],
  );
  const jobId = rows[0]!.id;
  await insertJobSource(jobId, n, ctx.scope, true, db);

  if (ctx.status !== 'rejected') {
    if (ctx.needsReview) await enqueueCuration(ctx.needsReview, jobId, { classification: n.classification, location: r.locationText }, db);
    if (decision.reviewDuplicateOf) await enqueueCuration('possible_duplicate', jobId, decision.reviewDuplicateOf, db);
    if (r.addedBy && r.addedBy !== 'pipeline') {
      // Curator submissions are published at once but logged for audit.
      await enqueueCuration('curator_submission', jobId, { curator: r.addedBy }, db, 'resolved');
    }
  }
  return { jobId, created: true };
}

async function insertJobSource(jobId: string, n: NormalizedListing, scope: string, primary: boolean, db: Q) {
  await db.query(
    `insert into job_sources (job_id, source_key, scope, original_platform, external_id, canonical_url, url, apply_url, is_primary, added_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (source_key, external_id) do update set last_seen_at = now(), missed_runs = 0`,
    [jobId, n.raw.source, scope, n.originalPlatform, n.raw.externalId, n.canonicalUrl, n.raw.url,
      n.raw.applyUrl ?? null, primary, n.raw.addedBy ?? 'pipeline'],
  );
}

async function touchJob(jobId: string, n: NormalizedListing, db: Q) {
  await db.query(
    `update jobs set last_seen_at = now(), updated_at = now(),
        valid_through = coalesce($2, valid_through),
        status = case when status in ('stale','expired') then 'active'::job_status else status end
      where id = $1`, [jobId, n.raw.validThrough ?? null]);
}

export async function enqueueCuration(kind: string, jobId: string | null, payload: object, db: Q = getPool(), state = 'open') {
  await db.query('insert into curation_queue (kind, job_id, payload, state) values ($1,$2,$3,$4)', [kind, jobId, payload, state]);
}

function makeSlug(n: NormalizedListing): string {
  const base = fold(`${n.title} ${n.companyName} ${n.location?.province ?? ''}`).replace(/\s+/g, '-').slice(0, 80);
  return `${base}-${randomBytes(3).toString('hex')}`;
}

// ── Expiry ─────────────────────────────────────────────────────────────────
/**
 * After a run: for each source scope that SUCCEEDED, rows not seen during the run get missed_runs + 1.
 * Failed scopes are left alone, so an outage never expires jobs. Then every live job's status is recomputed.
 */
export async function applyExpiry(runId: string, runStartedAt: Date, db: Q = getPool()) {
  await db.query(
    `update job_sources js set missed_runs = missed_runs + 1
       from source_runs sr
      where sr.run_id = $1 and sr.succeeded and js.source_key = sr.source_key
        and (sr.scope = '*' or js.scope = sr.scope)
        and js.last_seen_at < $2`, [runId, runStartedAt]);
  return recomputeStatuses(db);
}

export async function recomputeStatuses(db: Q = getPool()) {
  const modes = await getAccessModes(db);
  const { rows } = await db.query<{
    id: string; status: JobStatus; valid_through: Date | null; closed_reports: number;
    sources: { source_key: string; missed_runs: number; first_seen_at: string; renewed_at: string | null }[];
  }>(
    `select j.id, j.status, j.valid_through, j.closed_reports,
            coalesce(json_agg(json_build_object('source_key', s.source_key, 'missed_runs', s.missed_runs,
              'first_seen_at', s.first_seen_at, 'renewed_at', s.renewed_at)) filter (where s.id is not null), '[]') as sources
       from jobs j left join job_sources s on s.job_id = j.id
      where j.status in ('active','stale') and not j.is_native
      group by j.id`);
  const now = new Date();
  const changes: Record<string, number> = {};
  for (const j of rows) {
    const next = computeStatus({
      current: j.status,
      validThrough: j.valid_through ?? undefined,
      closedReports: j.closed_reports,
      now,
      sources: j.sources.map((s) => ({
        accessMode: modes.get(s.source_key) ?? 'curator_only',
        missedRuns: s.missed_runs,
        addedAt: new Date(s.first_seen_at),
        renewedAt: s.renewed_at ? new Date(s.renewed_at) : undefined,
      })),
    });
    if (next !== j.status) {
      await db.query('update jobs set status = $2, updated_at = now() where id = $1', [j.id, next]);
      changes[next] = (changes[next] ?? 0) + 1;
    }
  }
  return changes;
}

// ── Index feed ─────────────────────────────────────────────────────────────
export interface IndexJob {
  id: string; slug: string; title: string; company_name: string; sector: string | null; subsector: string | null;
  function: string | null; employment_type: string; work_mode: string; city: string | null; province: string | null;
  hub: string | null; country: string | null; posted_at: Date | null; is_native: boolean;
  primary_url: string; primary_platform: string; primary_source_id: string; also_on: string[];
}
/** Jobs visible on the board: active (or stale) and not waiting for review. */
export async function visibleJobs(db: Q = getPool()): Promise<IndexJob[]> {
  const { rows } = await db.query<IndexJob>(
    `select j.id, j.slug, j.title, j.company_name, j.sector, j.subsector, j.function, j.employment_type, j.work_mode,
            j.city, j.province, j.hub, j.country, j.posted_at, j.is_native,
            p.url as primary_url, p.original_platform as primary_platform, p.id as primary_source_id,
            coalesce(array_agg(distinct o.original_platform) filter (where o.id is not null and o.original_platform <> p.original_platform), '{}') as also_on
       from jobs j
       join lateral (select * from job_sources s where s.job_id = j.id order by s.is_primary desc, s.first_seen_at limit 1) p on true
       left join job_sources o on o.job_id = j.id
      where j.status in ('active','stale') and j.review_state <> 'pending'
      group by j.id, p.url, p.original_platform, p.id`);
  return rows;
}

// ── Web: clicks and reports ────────────────────────────────────────────────
export async function insertClick(c: {
  jobId: string; jobSourceId?: string; platform: string; placement: string; position?: number;
  query?: string; locale?: string; sessionHash?: string; userId?: string;
}, db: Q = getPool()) {
  await db.query(
    `insert into job_clicks (job_id, job_source_id, platform, placement, position, query, locale, session_hash, user_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [c.jobId, c.jobSourceId ?? null, c.platform, c.placement, c.position ?? null, c.query?.slice(0, 200) ?? null,
      c.locale ?? null, c.sessionHash ?? null, c.userId ?? null]);
}

/** One report per session per job; the second distinct report closes the job (EXPIRY_RULES.closeAfterReports). */
export async function reportClosed(jobId: string, sessionHash: string, db: Q = getPool()): Promise<{ closed: boolean }> {
  const ins = await db.query('insert into job_reports (job_id, session_hash) values ($1,$2) on conflict do nothing', [jobId, sessionHash]);
  if (!ins.rowCount) return { closed: false };
  const { rows } = await db.query<{ closed_reports: number }>(
    'update jobs set closed_reports = closed_reports + 1 where id = $1 returning closed_reports', [jobId]);
  await enqueueCuration('reported_closed', jobId, { reports: rows[0]?.closed_reports }, db);
  const changes = await recomputeOne(jobId, db);
  return { closed: changes === 'closed' };
}

async function recomputeOne(jobId: string, db: Q): Promise<JobStatus | undefined> {
  await recomputeStatuses(db);
  const { rows } = await db.query<{ status: JobStatus }>('select status from jobs where id = $1', [jobId]);
  return rows[0]?.status;
}

// ── Curation queue ─────────────────────────────────────────────────────────
export async function openCurationCounts(db: Q = getPool()): Promise<Record<string, number>> {
  const { rows } = await db.query<{ kind: string; n: string }>(
    `select kind, count(*) n from curation_queue where state = 'open' group by kind`);
  return Object.fromEntries(rows.map((r) => [r.kind, Number(r.n)]));
}
