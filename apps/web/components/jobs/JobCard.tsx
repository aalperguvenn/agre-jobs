'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { useLocale } from 'next-intl';
import { PLATFORMS, type PlatformKey } from '@agre/taxonomy';
import { trackJobClick, type Placement } from '@/lib/track';

export interface JobCardData {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  city?: string | null;
  hubLabel?: string | null;
  workModeLabel?: string | null;
  sectorLabel?: string | null;
  employmentLabel?: string | null;
  postedLabel?: string | null;      // "bugün", "2g" — formatted by the list
  isNative: boolean;
  /** Primary source: where a click goes (referral params already applied server-side, see lib/jobs.ts). */
  url: string;
  platform: PlatformKey;
  jobSourceId?: string;
  /** Other platforms the same job was found on. */
  alsoOn?: PlatformKey[];
}

interface Props {
  job: JobCardData;
  placement: Placement;
  position: number;
  query?: string;
}

const T = {
  tr: { opensOn: (p: string) => `${p} sitesinde yeni sekmede açılır`, alsoOn: 'Ayrıca:', report: 'İlan kapandı mı?', reported: 'Bildirildi, teşekkürler' },
  en: { opensOn: (p: string) => `opens on ${p} in a new tab`, alsoOn: 'Also on', report: 'Role closed?', reported: 'Reported, thanks' },
};

/**
 * Job card (outline Section 5).
 * Aggregated jobs: the title link carries the real external URL (target=_blank, rel=noopener noreferrer) and is
 * stretched over the whole card, so the card has exactly one link. A beacon records the click without delaying it.
 * Native jobs keep the in-app detail page.
 */
export function JobCard({ job, placement, position, query }: Props) {
  const locale = useLocale() as 'tr' | 'en';
  const t = T[locale];
  const [reported, setReported] = useState(false);
  const platformName = PLATFORMS[job.platform];
  const href = job.url;

  const onOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    // Left click, middle click (auxclick) and modified clicks all open the job; record each once.
    if (e.type === 'auxclick' && e.button !== 1) return;
    trackJobClick({ jobId: job.id, jobSourceId: job.jobSourceId, platform: job.platform, placement, position, query, locale });
  };

  const report = async () => {
    setReported(true);
    await fetch(`/api/jobs/${job.id}/report-closed`, { method: 'POST' }).catch(() => undefined);
  };

  const meta = [job.city ?? job.hubLabel, job.workModeLabel, job.employmentLabel].filter(Boolean).join(' · ');

  return (
    <article className="group relative rounded-[4px] border border-agre-sage/40 bg-white p-4 transition-colors hover:border-agre-navy focus-within:border-agre-navy">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-poppins text-[17px] font-medium leading-snug text-agre-ink">
            {job.isNative ? (
              <Link href={`/${locale}/jobs/${job.slug}`} className="after:absolute after:inset-0 after:content-['']"
                onClick={() => trackJobClick({ jobId: job.id, platform: 'agre_jobs', placement, position, query, locale })}>
                {job.title}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onOpen}
                onAuxClick={onOpen}
                aria-label={`${job.title}, ${job.companyName} — ${t.opensOn(platformName)}`}
                data-job-id={job.id}
                data-source={job.platform}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {job.title}
                <ExternalIcon />
              </a>
            )}
          </h3>
          <p className="mt-0.5 font-montserrat text-sm text-agre-ink">{job.companyName}</p>
          {meta && <p className="mt-1 font-montserrat text-[13px] text-agre-muted">{meta}</p>}
        </div>
        {job.postedLabel && <span className="shrink-0 font-montserrat text-xs text-agre-muted">{job.postedLabel}</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceBadge platform={job.platform} />
        {job.sectorLabel && (
          <span className="rounded-full bg-agre-lime-tint px-2.5 py-0.5 font-montserrat text-xs text-agre-navy">{job.sectorLabel}</span>
        )}
        {!!job.alsoOn?.length && (
          <span className="font-montserrat text-xs text-agre-muted">
            {t.alsoOn} {job.alsoOn.map((p) => PLATFORMS[p]).join(', ')}
          </span>
        )}
        {!job.isNative && (
          // Sits above the stretched link (relative z-10) so it stays clickable.
          <button type="button" onClick={report} disabled={reported}
            className="relative z-10 ml-auto font-montserrat text-xs text-agre-muted underline-offset-2 hover:underline disabled:no-underline">
            {reported ? t.reported : t.report}
          </button>
        )}
      </div>
    </article>
  );
}

/** Platform name as plain text (no third-party logos without permission). */
export function SourceBadge({ platform }: { platform: PlatformKey }) {
  return (
    <span className="rounded-[2px] border border-agre-navy/20 px-2 py-0.5 font-montserrat text-[11px] font-medium uppercase tracking-[0.04em] text-agre-navy">
      {PLATFORMS[platform]}
    </span>
  );
}

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="ml-1 inline h-3.5 w-3.5 align-[-1px] text-agre-sage" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9" />
    </svg>
  );
}
