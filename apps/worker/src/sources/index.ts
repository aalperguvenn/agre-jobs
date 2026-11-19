import type { SourceKey } from '@agre/core';
import { ats } from './ats';
import { careerjet } from './careerjet';
import { employerFeed } from './employer-feed';
import type { SourceAdapter } from './types';

/**
 * Automated adapters only. LinkedIn, Kariyer.net, YeniBirİş and Indeed have no adapter on purpose:
 * they are curator-only (see packages/db/migrations/002_seed_sources.sql). When a licensed feed is agreed,
 * add an adapter here and switch that source's access_mode to 'partner_feed'.
 */
export const ADAPTERS: Partial<Record<SourceKey, SourceAdapter>> = {
  careerjet,
  ats,
  employer_feed: employerFeed,
};
