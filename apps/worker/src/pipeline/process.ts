import { decideDedupe, normalizeListing, type NormalizedListing, type RawListing } from '@agre/core';
import {
  applyDecision, getOrganization, PgDedupeRepository, recordRaw, type OrgRow, type UpsertContext,
} from '@agre/db';

export interface ProcessStats {
  fetched: number; created: number; updated: number; merged: number;
  sentToReview: number; skippedOffTaxonomy: number; errors: number;
}
export const emptyStats = (): ProcessStats => ({
  fetched: 0, created: 0, updated: 0, merged: 0, sentToReview: 0, skippedOffTaxonomy: 0, errors: 0,
});

const orgCache = new Map<string, OrgRow | undefined>();

/**
 * Decide publish / review / skip for one normalized listing (outline Section 4).
 * - Search sources (Careerjet): off-taxonomy results are skipped, not stored.
 * - ATS and employer feeds: organizations with any_role=true list every role (PRD curation rule);
 *   unclassifiable titles take the organization's sector.
 * - Curator submissions: a human chose the role, so it is never rejected; weak matches go to review.
 */
export function publishContext(n: NormalizedListing, org?: OrgRow): UpsertContext | 'skip' {
  const c = n.classification;
  const fromOrg = n.raw.source === 'ats' || n.raw.source === 'employer_feed';
  const byCurator = !!n.raw.addedBy && n.raw.addedBy !== 'pipeline';
  const unknownLocation = !n.location ? 'unknown_location' as const : null;

  if (fromOrg && org) {
    if (c.decision === 'accept') return { scope: '', status: 'active', needsReview: unknownLocation };
    if (org.any_role) {
      return { scope: '', status: 'active', needsReview: unknownLocation, sector: org.sector, subsector: org.subsector };
    }
    // Conventional company: only on-taxonomy roles (innovation, sustainability, R&D, quality).
    return c.decision === 'review' ? { scope: '', status: 'active', needsReview: 'low_confidence' } : 'skip';
  }

  if (c.decision === 'reject') {
    return byCurator ? { scope: '', status: 'active', needsReview: 'low_confidence' } : 'skip';
  }
  if (c.decision === 'review') return { scope: '', status: 'active', needsReview: 'low_confidence' };
  return { scope: '', status: 'active', needsReview: unknownLocation };
}

export async function processListing(
  raw: RawListing, scope: string, runId: string | null, stats: ProcessStats, repo = new PgDedupeRepository(),
) {
  stats.fetched++;
  try {
    await recordRaw(runId, raw);
    const n = normalizeListing(raw);

    let org: OrgRow | undefined;
    if (raw.organizationId) {
      if (!orgCache.has(raw.organizationId)) orgCache.set(raw.organizationId, await getOrganization(raw.organizationId));
      org = orgCache.get(raw.organizationId);
    }

    const ctx = publishContext(n, org);
    if (ctx === 'skip') { stats.skippedOffTaxonomy++; return; }
    ctx.scope = scope;

    const decision = await decideDedupe(n, repo);
    const { created } = await applyDecision(n, decision, ctx);

    if (created) stats.created++;
    else if (decision.action === 'attach_source') stats.merged++;
    else stats.updated++;
    if (created && (ctx.needsReview || (decision.action === 'create' && decision.reviewDuplicateOf))) stats.sentToReview++;
  } catch (err) {
    stats.errors++;
    console.error('process failed', raw.source, raw.externalId, err);
  }
}
