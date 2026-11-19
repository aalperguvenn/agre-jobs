import type { AccessMode } from './types';

export type JobStatus = 'active' | 'stale' | 'expired' | 'closed' | 'rejected';

export const EXPIRY_RULES = {
  /** Automated sources: missed runs before a job turns stale / expired. */
  staleAfterMissedRuns: 1,
  expireAfterMissedRuns: 2,
  /** Curator-added links are never re-visited by the pipeline; they expire after this many days unless renewed. */
  curatedTtlDays: 30,
  /** "Report closed" clicks that close a job automatically. */
  closeAfterReports: 2,
} as const;

export interface SourceState {
  accessMode: AccessMode;
  missedRuns: number;   // consecutive successful runs of that source that did not return the listing
  addedAt: Date;        // first_seen_at for this source row
  renewedAt?: Date;     // curator renewal
}

/**
 * Status of one job from all of its source rows. A job stays alive while any source still lists it.
 * Note: missedRuns is only incremented when that source's run *succeeded*, so an outage never expires jobs.
 */
export function computeStatus(input: {
  current: JobStatus;
  sources: SourceState[];
  validThrough?: Date;
  closedReports: number;
  now: Date;
}): JobStatus {
  if (input.current === 'closed' || input.current === 'rejected') return input.current;
  if (input.closedReports >= EXPIRY_RULES.closeAfterReports) return 'closed';
  if (input.validThrough && input.validThrough < input.now) return 'expired';
  if (input.sources.length === 0) return 'expired';

  const perSource = input.sources.map((s) => sourceStatus(s, input.now));
  if (perSource.includes('active')) return 'active';
  if (perSource.includes('stale')) return 'stale';
  return 'expired';
}

function sourceStatus(s: SourceState, now: Date): 'active' | 'stale' | 'expired' {
  if (s.accessMode === 'curator_only') {
    const base = s.renewedAt ?? s.addedAt;
    const ageDays = (now.getTime() - base.getTime()) / 86_400_000;
    return ageDays > EXPIRY_RULES.curatedTtlDays ? 'expired' : 'active';
  }
  if (s.missedRuns >= EXPIRY_RULES.expireAfterMissedRuns) return 'expired';
  if (s.missedRuns >= EXPIRY_RULES.staleAfterMissedRuns) return 'stale';
  return 'active';
}
