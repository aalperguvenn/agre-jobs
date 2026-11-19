import type { RawListing, SourceKey } from '@agre/core';
import type { OrgRow, SearchProfile } from '@agre/db';

/** One unit of work inside a source: '*' for search sources, a board token for ATS sources. */
export interface ScopeResult {
  scope: string;
  ok: boolean;
  listings: RawListing[];
  error?: string;
}

export interface DiscoverContext {
  profiles: SearchProfile[];
  atsOrgs: OrgRow[];
  feedOrgs: OrgRow[];
  log: (msg: string, extra?: object) => void;
}

/** Every source implements this; the pipeline never knows which site it talks to. */
export interface SourceAdapter {
  key: SourceKey;
  discover(ctx: DiscoverContext): Promise<ScopeResult[]>;
}
