import { trigramSimilarity } from './fingerprint';
import type { NormalizedListing, SourceKey } from './types';

export const NEAR_DUPLICATE_THRESHOLD = 0.85;

/** What the dedupe step needs from storage. Implemented for Postgres in @agre/db and in memory for tests. */
export interface DedupeRepository {
  findJobBySourceExternalId(source: SourceKey, externalId: string): Promise<string | undefined>;
  findJobByCanonicalUrl(canonicalUrl: string): Promise<string | undefined>;
  findJobByFingerprint(fingerprint: string): Promise<string | undefined>;
  /** Active jobs of the same normalized company in the same province (or city). */
  findCandidates(companyNormalized: string, province?: string): Promise<{ id: string; title: string }[]>;
}

export type DedupeDecision =
  | { action: 'update_source'; jobId: string; reason: 'source_id' }
  | { action: 'attach_source'; jobId: string; reason: 'canonical_url' | 'fingerprint' }
  | { action: 'create'; reviewDuplicateOf?: { jobId: string; similarity: number } };

/**
 * Deduplication, in order (outline Section 4):
 * 1. same source + external id → update that row
 * 2. same canonical URL        → same job (attach source if new)
 * 3. same fingerprint          → cross-posting: attach a new job_sources row
 * 4. near match (trigram ≥ 0.85, same company + province) → create, but flag for one-click merge
 */
export async function decideDedupe(listing: NormalizedListing, repo: DedupeRepository): Promise<DedupeDecision> {
  const bySource = await repo.findJobBySourceExternalId(listing.raw.source, listing.raw.externalId);
  if (bySource) return { action: 'update_source', jobId: bySource, reason: 'source_id' };

  const byUrl = await repo.findJobByCanonicalUrl(listing.canonicalUrl);
  if (byUrl) return { action: 'attach_source', jobId: byUrl, reason: 'canonical_url' };

  const byPrint = await repo.findJobByFingerprint(listing.fingerprint);
  if (byPrint) return { action: 'attach_source', jobId: byPrint, reason: 'fingerprint' };

  const candidates = await repo.findCandidates(listing.companyNormalized, listing.location?.province);
  let best: { jobId: string; similarity: number } | undefined;
  for (const c of candidates) {
    const sim = trigramSimilarity(listing.title, c.title);
    if (sim >= NEAR_DUPLICATE_THRESHOLD && (!best || sim > best.similarity)) best = { jobId: c.id, similarity: Number(sim.toFixed(2)) };
  }
  return best ? { action: 'create', reviewDuplicateOf: best } : { action: 'create' };
}
