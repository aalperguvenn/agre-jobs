# Agre Jobs — job aggregation pipeline, outbound links and Popüler tags

Implements the approved technical outline (*Agre Jobs — Job Aggregation Pipeline: Technical Outline*, 19 Nov 2026)
on the stack in the architecture notes: Next.js App Router + next-intl, Postgres (Supabase), Meilisearch.
Sectors, subsectors and regional hubs follow the **PRD & MVP Blueprint** (10 sectors, 56 subsectors, 8 Türkiye hubs + 5 regional hubs).

## What's here

```
packages/taxonomy   PRD sectors/subsectors with TR+EN keywords, 81 provinces → hubs, regional countries,
                    functions, contract types, platforms, the five Popüler tags
packages/core       Pure pipeline logic (no I/O): Turkish-aware folding, URL canonicalization + platform detection,
                    sector/function classifier, location → hub, contract/work-mode detection, fingerprint,
                    dedupe decision, expiry rules, curator saved-search links and submission parsing
packages/db         SQL migrations + Postgres repository (dedupe lookups, upsert, expiry, index feed, clicks, reports)
apps/worker         pg-boss worker: source adapters, weekly run, Meilisearch rebuild, Monday curator digest
apps/web            JobCard (external link + telemetry), JobSearchBox + PopularTags, /api/clicks,
                    /api/jobs/:id/report-closed, curator inbox (/curate/add, /curate/searches), brand Tailwind tokens
```

## How sourcing works

| Source | Mode | How jobs arrive |
| --- | --- | --- |
| LinkedIn, Kariyer.net, YeniBirİş, Indeed | `curator_only` | Monday digest + `/curate/searches` give curators ready-made searches on each platform. Curators add chosen roles at `/curate/add` (URL + key fields). The pipeline never requests these sites. |
| Careerjet partner API | `api`, **seeded disabled** | Weekly keyword queries from the taxonomy. Enable only after Careerjet confirms batch use (the API requires an end-user `user_ip`) and the `tr_TR` locale. |
| Company ATS (Greenhouse, Lever, Ashby) | `ats_public`, seeded disabled | Public job-board APIs for directory organizations that gave their board token. |
| Employer feeds | `partner_feed`, seeded disabled | Opt-in JSON feed or careers page with schema.org `JobPosting`. |

An automated source runs only when `enabled = true` **and** `terms_reviewed_at` is set (checked in code and by a DB constraint).
To switch Kariyer.net or YeniBirİş to a licensed feed later: add an adapter in `apps/worker/src/sources/` and change that
source's `access_mode` to `partner_feed`; nothing else changes.

## Pipeline rules (where to change them)

- **Tagging:** `packages/taxonomy/src/sectors.ts` (keywords), thresholds in `packages/core/src/classify.ts`.
  Weak matches go to `curation_queue` (`low_confidence`); unknown locations to `unknown_location`.
- **Publish rules:** `apps/worker/src/pipeline/process.ts`. Search results off-taxonomy are skipped. Curator picks are never
  rejected. Organizations with `any_role = true` list every role (PRD rule); set `false` for large conventional food companies.
- **Dedupe:** source ID → canonical URL → fingerprint (company + title + province) → near match (trigram ≥ 0.85, flagged).
  Cross-posts become one card with "Also on …".
- **Expiry:** automated sources: stale after 1 missed successful run, expired after 2; a failed run never expires anything.
  Curated links: 30 days unless renewed (an automated sighting renews them). Two "Report closed" sessions close a job.

## Schedule (pg-boss, Europe/Istanbul)

| Queue | When | What |
| --- | --- | --- |
| `ingest-weekly` | Mon 03:00 | sources → normalize → dedupe → expire → Meilisearch swap → purge raw > 30 days |
| `curator-digest` | Mon 09:00 | email: run stats, review queue, clicks by platform, weekly saved searches |
| `expiry-daily` | daily 04:00 | curated-link TTL and reports, reindex |
| `curator-submission` | on demand | one curator-added role, live within a minute |

## Web behaviour

- **Outbound:** aggregated cards link straight to the original posting: `<a href="<external>" target="_blank" rel="noopener noreferrer">`,
  stretched over the card (one link per card). `sendBeacon` posts to `/api/clicks` (job, source, platform, placement, position,
  query, locale, daily-rotating session hash; no IP or user agent). A text badge names the platform. Company-site links get
  `utm_source=agrejobs`. Native Agre Jobs postings keep the in-app detail page.
- **Popüler:** exactly `Food Scientist`, `R&D Chef`, `Food Innovation Consultant`, `Culinary Tour Host`, `Food Entrepreneur`
  in that order, labels unchanged in TR and EN (heading: "Popüler" / "Popular"). Click sets `?q=` (board: in place, keeps filters,
  resets paging; landing: navigates to `/[locale]/jobs?q=`); clicking the active tag clears it; `aria-pressed` shows state.
  Meilisearch synonyms map each label to Turkish titles (e.g. R&D Chef ↔ Ar-Ge şefi).

## Run it

```bash
cp .env.example .env            # fill in
npm install
npm run db:migrate              # 001_init.sql + 002_seed_sources.sql
npm test                        # 37 unit tests
TEST_DATABASE_URL=$DATABASE_URL npx vitest run   # + 6 Postgres integration tests
npm run worker                  # long-running worker with schedules
npm run ingest:now              # one manual weekly run
```

Enable a source after its terms review:

```sql
update sources set terms_reviewed_at = now(), enabled = true where key = 'ats';
insert into organizations (slug, name, ats_provider, ats_token, sector, subsector, any_role)
values ('ornek-agtech', 'Örnek AgTech', 'greenhouse', 'ornekagtech', 'agtech', 'farm-software', true);
```

## Before production

1. Wire `apps/web/lib/auth.ts` `requireCurator()` to Supabase Auth (curator role). `/curate` refuses all requests until then.
2. Careerjet: confirm batch use, locale and display terms in writing, then enable.
3. Legal review of the sourcing approach and the İŞKUR licence question (PRD Section 5). This code follows published terms as read
   in Nov 2026; it is not legal advice.
4. The web files assume the existing next-intl setup (`[locale]` segment, `NextIntlClientProvider`) and Poppins/Montserrat loaded as
   `--font-poppins` / `--font-montserrat` CSS variables.
5. Curator submissions trigger a full index rebuild; fine at MVP volume, switch to single-document upserts past ~20k jobs.
