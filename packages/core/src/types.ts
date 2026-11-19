import type { EmploymentType, HubId, PlatformKey, WorkMode, FunctionId } from '@agre/taxonomy';

/** Which ingestion channel produced a listing (matches `sources.key`). */
export type SourceKey =
  | 'linkedin' | 'kariyer_net' | 'yenibiris' | 'indeed'   // curator-only today
  | 'careerjet' | 'ats' | 'employer_feed' | 'native';

export type AccessMode = 'api' | 'partner_feed' | 'ats_public' | 'curator_only' | 'disabled';

/** What a source adapter or the curator inbox hands to the pipeline. */
export interface RawListing {
  source: SourceKey;
  /** Stable ID inside that source (platform job ID, ATS id, or a hash of the URL). */
  externalId: string;
  url: string;
  applyUrl?: string;
  title: string;
  company: string;
  locationText?: string;
  descriptionHtml?: string;
  postedAt?: string;          // ISO date
  validThrough?: string;      // ISO date
  employmentHint?: string;    // raw contract text from the source
  remoteHint?: boolean;
  salary?: { min?: number; max?: number; currency?: string; period?: 'hour' | 'day' | 'week' | 'month' | 'year' };
  organizationId?: string;    // known directory organization (ATS / feed sources)
  addedBy?: string;           // curator user id, or 'pipeline'
  payload?: unknown;          // original record, kept in raw_listings for re-parsing
}

export interface Location {
  city?: string;
  province?: string;
  hub?: HubId;
  country: string; // ISO-ish lower-case English name; 'turkiye' for Türkiye, 'remote' for remote
}

export interface Classification {
  sector?: string;
  subsector?: string;
  score: number;
  confidence: number;          // 0..1
  decision: 'accept' | 'review' | 'reject';
  matched: string[];           // keywords that matched, for curator review
}

/** A listing after normalization and tagging, ready for deduplication. */
export interface NormalizedListing {
  raw: RawListing;
  title: string;
  companyName: string;
  companyNormalized: string;
  canonicalUrl: string;
  originalPlatform: PlatformKey;
  platformJobId?: string;
  classification: Classification;
  function?: FunctionId;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location?: Location;
  fingerprint: string;
  descriptionSnippet?: string;
}
