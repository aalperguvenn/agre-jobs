import PgBoss from 'pg-boss';
import { curatorSubmissionToRaw, type CuratorSubmission } from '@agre/core';
import { closePool, recomputeStatuses } from '@agre/db';
import { runWeekly } from './run-weekly';
import { sendCuratorDigest } from './digest';
import { emptyStats, processListing } from './pipeline/process';
import { rebuildSearchIndex } from './pipeline/search-index';

/**
 * Worker process. pg-boss keeps the queue and the schedule in Postgres, so no separate cron service is needed.
 *   ingest-weekly       Monday 03:00 Europe/Istanbul   full run (sources → normalize → dedupe → expire → index)
 *   curator-digest      Monday 09:00 Europe/Istanbul   email to curators
 *   expiry-daily        every day 04:00                 curated-link TTL and reports, then reindex
 *   curator-submission  on demand (from the web app)    one curator-added listing, published within seconds
 */
const TZ = 'Europe/Istanbul';
const Q = { weekly: 'ingest-weekly', digest: 'curator-digest', daily: 'expiry-daily', curator: 'curator-submission' } as const;

async function main() {
  const boss = new PgBoss({ connectionString: process.env.DATABASE_URL! });
  boss.on('error', (e) => console.error('[pg-boss]', e));
  await boss.start();

  for (const name of Object.values(Q)) await boss.createQueue(name);
  await boss.schedule(Q.weekly, '0 3 * * 1', {}, { tz: TZ });
  await boss.schedule(Q.digest, '0 9 * * 1', {}, { tz: TZ });
  await boss.schedule(Q.daily, '0 4 * * *', {}, { tz: TZ });

  await boss.work(Q.weekly, async () => { await runWeekly('cron'); });
  await boss.work(Q.digest, async () => { await sendCuratorDigest(); });
  await boss.work(Q.daily, async () => {
    await recomputeStatuses();
    if (process.env.MEILI_HOST) await rebuildSearchIndex();
  });
  await boss.work<CuratorSubmission>(Q.curator, async ([job]) => {
    if (!job) return;
    const stats = emptyStats();
    await processListing(curatorSubmissionToRaw(job.data), '*', null, stats);
    if (stats.errors) throw new Error('curator submission failed');
    if (process.env.MEILI_HOST) await rebuildSearchIndex();
  });

  console.log('[worker] ready');
  const stop = async () => { await boss.stop(); await closePool(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (process.argv.includes('--now')) {
  runWeekly('manual').then(() => closePool()).catch((e) => { console.error(e); process.exit(1); });
} else {
  main().catch((e) => { console.error(e); process.exit(1); });
}
