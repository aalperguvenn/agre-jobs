import 'server-only';
import { withReferral } from '@agre/core';
import { ALL_SUBSECTORS, SECTORS, type PlatformKey } from '@agre/taxonomy';
import type { JobCardData } from '@/components/jobs/JobCard';

/** Shape of a document in the Meilisearch `jobs` index (written by apps/worker/src/pipeline/search-index.ts). */
export interface JobDoc {
  id: string; slug: string; title: string; company_name: string; sector: string | null; subsector: string | null;
  employment_type: string; work_mode: string; city: string | null; hub_label: { tr: string; en: string } | null;
  is_native: boolean; posted_at_ts: number; url: string; original_platform: PlatformKey; job_source_id: string;
  also_on: PlatformKey[];
}

const SECTOR_LABEL = new Map(SECTORS.map((s) => [s.id, s.label]));
const SUB_LABEL = new Map(ALL_SUBSECTORS.map((s) => [s.id, s.label]));

const WORK_MODE = {
  tr: { on_site: 'İş yerinde', hybrid: 'Hibrit', remote: 'Uzaktan', travelling: 'Gezici' },
  en: { on_site: 'On-site', hybrid: 'Hybrid', remote: 'Remote', travelling: 'Travelling' },
} as Record<'tr' | 'en', Record<string, string>>;
const EMPLOYMENT = {
  tr: { full_time: 'Tam zamanlı', part_time: 'Yarı zamanlı', seasonal: 'Sezonluk', project_freelance: 'Proje / serbest',
    internship: 'Staj', stage: 'Stage', apprenticeship: 'Çıraklık', fellowship: 'Fellowship', volunteer: 'Gönüllü' },
  en: { full_time: 'Full-time', part_time: 'Part-time', seasonal: 'Seasonal', project_freelance: 'Project & freelance',
    internship: 'Internship', stage: 'Stage', apprenticeship: 'Apprenticeship', fellowship: 'Fellowship', volunteer: 'Volunteer' },
} as Record<'tr' | 'en', Record<string, string>>;

export function toCardData(doc: JobDoc, locale: 'tr' | 'en', now = Date.now()): JobCardData {
  const days = doc.posted_at_ts ? Math.floor((now / 1000 - doc.posted_at_ts) / 86_400) : undefined;
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    companyName: doc.company_name,
    city: doc.city,
    hubLabel: doc.hub_label?.[locale] ?? null,
    workModeLabel: WORK_MODE[locale]![doc.work_mode] ?? null,
    employmentLabel: doc.employment_type === 'full_time' ? null : EMPLOYMENT[locale]![doc.employment_type] ?? null,
    sectorLabel: (doc.subsector ? SUB_LABEL.get(doc.subsector)?.[locale] : undefined)
      ?? (doc.sector ? SECTOR_LABEL.get(doc.sector)?.[locale] : undefined) ?? null,
    postedLabel: days === undefined ? null : days <= 0 ? (locale === 'tr' ? 'bugün' : 'today') : `${days}${locale === 'tr' ? 'g' : 'd'}`,
    isNative: doc.is_native,
    url: withReferral(doc.url, doc.original_platform),
    platform: doc.original_platform,
    jobSourceId: doc.job_source_id,
    alsoOn: doc.also_on,
  };
}
