import {
  applyExpiry, finishRun, getAtsOrganizations, getFeedOrganizations, getRunnableSources, getSearchProfiles,
  purgeRawListings, recordSourceRun, startRun, syncSearchProfiles,
} from '@agre/db';
import { ADAPTERS } from './sources';
import { emptyStats, processListing, type ProcessStats } from './pipeline/process';
import { rebuildSearchIndex } from './pipeline/search-index';

const log = (msg: string, extra?: object) => console.log(`[ingest] ${msg}`, extra ? JSON.stringify(extra) : '');

/**
 * The weekly run (outline Section 2). Each source runs in isolation: a failure in one source or one ATS board
 * is recorded and skipped, and never expires that source's jobs.
 */
export async function runWeekly(trigger: 'cron' | 'manual' = 'cron') {
  const run = await startRun(trigger);
  log('run started', { runId: run.id, trigger });
  const perSource: Record<string, ProcessStats & { scopesFailed: number }> = {};
  let anyFailure = false;

  try {
    await syncSearchProfiles();
    const [sources, profiles, atsOrgs, feedOrgs] = await Promise.all([
      getRunnableSources(), getSearchProfiles(), getAtsOrganizations(), getFeedOrganizations(),
    ]);
    log('runnable sources', { sources: sources.map((s) => s.key) });

    for (const source of sources) {
      const adapter = ADAPTERS[source.key];
      if (!adapter) { log('no adapter for source, skipped', { source: source.key }); continue; }
      const stats = { ...emptyStats(), scopesFailed: 0 };
      perSource[source.key] = stats;

      let results;
      try {
        results = await adapter.discover({ profiles, atsOrgs, feedOrgs, log });
      } catch (err) {
        anyFailure = true;
        await recordSourceRun(run.id, source.key, '*', false, 0, String(err));
        log('source failed', { source: source.key, error: String(err) });
        continue;
      }

      for (const r of results) {
        for (const listing of r.listings) await processListing(listing, r.scope, run.id, stats);
        await recordSourceRun(run.id, source.key, r.scope, r.ok, r.listings.length, r.error);
        if (!r.ok) { stats.scopesFailed++; anyFailure = true; }
      }
      log('source done', { source: source.key, ...stats });
    }

    const expiry = await applyExpiry(run.id, run.started_at);
    const indexed = process.env.MEILI_HOST ? await rebuildSearchIndex() : 0;
    await purgeRawListings(30);

    const status = anyFailure ? 'partial' : 'succeeded';
    await finishRun(run.id, status, { perSource, expiry, indexed });
    log('run finished', { status, expiry, indexed });
  } catch (err) {
    await finishRun(run.id, 'failed', { perSource, error: String(err) });
    log('run failed', { error: String(err) });
    throw err;
  }
}
