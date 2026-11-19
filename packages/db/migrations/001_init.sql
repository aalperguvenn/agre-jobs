-- Agre Jobs: job aggregation schema (outline Section 3).
-- Postgres 15+ (Supabase). Run once; later changes go in new numbered files.

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ── Sources ────────────────────────────────────────────────────────────────
create type access_mode as enum ('api', 'partner_feed', 'ats_public', 'curator_only', 'disabled');

create table sources (
  key               text primary key,          -- linkedin, kariyer_net, yenibiris, indeed, careerjet, ats, employer_feed, native
  display_name      text not null,
  access_mode       access_mode not null,
  terms_reviewed_at timestamptz,               -- automated modes refuse to run while this is null
  enabled           boolean not null default true,
  notes             text,
  constraint automated_needs_terms_review check (
    access_mode in ('curator_only', 'disabled') or terms_reviewed_at is not null or not enabled
  )
);

-- ── Organizations (minimal; full directory model lives elsewhere) ─────────
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  ats_provider  text check (ats_provider in ('greenhouse', 'lever', 'lever_eu', 'ashby')),
  ats_token     text,                          -- board token / site slug, given by the organization
  feed_url      text,                          -- opt-in JSON feed or careers page with schema.org JobPosting
  feed_consent_at timestamptz,                 -- when the organization agreed to be ingested
  sector        text,                          -- PRD sector, used when a role's title alone does not classify
  subsector     text,
  any_role      boolean not null default true, -- PRD curation rule: innovation-led orgs list any role;
                                               -- set false for large conventional food companies
  created_at    timestamptz not null default now()
);

-- ── Taxonomy-driven query matrix ──────────────────────────────────────────
create table search_profiles (
  id                serial primary key,
  sector            text not null,
  subsector         text not null unique,
  keywords_tr       text[] not null,
  keywords_en       text[] not null,
  negative_keywords text[] not null default '{}',
  hubs              text[] not null default '{}',   -- empty = whole country
  active            boolean not null default true
);

-- ── Runs and raw data ─────────────────────────────────────────────────────
create table ingestion_runs (
  id          uuid primary key default gen_random_uuid(),
  trigger     text not null check (trigger in ('cron', 'manual', 'curator')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running' check (status in ('running', 'succeeded', 'partial', 'failed')),
  stats       jsonb not null default '{}'::jsonb
);

create table source_runs (                        -- per-source outcome; expiry only counts successful ones
  run_id     uuid references ingestion_runs(id) on delete cascade,
  source_key text references sources(key),
  scope      text not null default '*',           -- e.g. ATS board token, so one failing board does not expire others
  succeeded  boolean not null,
  fetched    int not null default 0,
  error      text,
  primary key (run_id, source_key, scope)
);

create table raw_listings (
  id           bigserial primary key,
  run_id       uuid references ingestion_runs(id) on delete set null,
  source_key   text not null references sources(key),
  external_id  text not null,
  url          text not null,
  payload      jsonb not null,
  content_hash text not null,
  fetched_at   timestamptz not null default now()
);
create index raw_listings_fetched_at_idx on raw_listings (fetched_at);  -- purge job deletes rows older than 30 days

-- ── Canonical jobs ────────────────────────────────────────────────────────
create type job_status as enum ('active', 'stale', 'expired', 'closed', 'rejected');
create type review_state as enum ('none', 'pending', 'approved');

create table jobs (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  title                 text not null,
  company_name          text not null,
  company_normalized    text not null,
  organization_id       uuid references organizations(id),
  sector                text,
  subsector             text,
  function              text,
  employment_type       text not null default 'full_time',
  work_mode             text not null default 'on_site',
  city                  text,
  province              text,
  hub                   text,
  country               text,
  salary_min            numeric,
  salary_max            numeric,
  salary_currency       text,
  salary_period         text,
  description_snippet   text,                   -- short snippet only; full text stays on the source
  posted_at             date,
  valid_through         date,
  status                job_status not null default 'active',
  review_state          review_state not null default 'none',
  fingerprint           text not null,
  classifier_confidence numeric(3,2),
  classifier_matched    text[],
  is_native             boolean not null default false,
  closed_reports        int not null default 0,
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index jobs_fingerprint_idx on jobs (fingerprint) where status in ('active', 'stale');
create index jobs_company_province_idx on jobs (company_normalized, province) where status in ('active', 'stale');
create index jobs_title_trgm_idx on jobs using gin (title gin_trgm_ops);
create index jobs_status_idx on jobs (status);

-- One row per place a job was found.
create table job_sources (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references jobs(id) on delete cascade,
  source_key        text not null references sources(key),
  scope             text not null default '*',     -- ATS board token for ATS rows
  original_platform text not null,                 -- linkedin | kariyer_net | yenibiris | indeed | careerjet | company_site | agre_jobs
  external_id       text not null,
  canonical_url     text not null,
  url               text not null,                 -- as received, for display
  apply_url         text,
  is_primary        boolean not null default false,
  missed_runs       int not null default 0,
  added_by          text not null default 'pipeline',
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  renewed_at        timestamptz,
  unique (source_key, external_id),
  unique (canonical_url)
);
create index job_sources_job_idx on job_sources (job_id);

-- ── Manual curation hook ──────────────────────────────────────────────────
create table curation_queue (
  id          bigserial primary key,
  kind        text not null check (kind in ('low_confidence', 'possible_duplicate', 'curator_submission', 'reported_closed', 'unknown_location')),
  job_id      uuid references jobs(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  state       text not null default 'open' check (state in ('open', 'resolved', 'dismissed')),
  resolved_by text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index curation_queue_open_idx on curation_queue (state, kind) where state = 'open';

-- ── Click telemetry (no IP, no user agent) ────────────────────────────────
create table job_clicks (
  id            bigserial primary key,
  job_id        uuid not null references jobs(id) on delete cascade,
  job_source_id uuid references job_sources(id) on delete set null,
  platform      text not null,
  placement     text not null check (placement in ('list', 'home', 'popular', 'organization', 'email', 'other')),
  position      int,
  query         text,
  locale        text check (locale in ('tr', 'en')),
  session_hash  text,               -- daily-rotating hash of an anonymous first-party cookie
  user_id       uuid,
  created_at    timestamptz not null default now()
);
create index job_clicks_job_idx on job_clicks (job_id, created_at);
create index job_clicks_platform_week_idx on job_clicks (platform, created_at);

create table job_reports (          -- "Report closed"; one per session per job
  job_id       uuid references jobs(id) on delete cascade,
  session_hash text not null,
  created_at   timestamptz not null default now(),
  primary key (job_id, session_hash)
);
