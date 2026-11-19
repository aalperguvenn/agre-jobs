import { getTranslations } from 'next-intl/server';
import { JobCard } from './JobCard';
import { toCardData, type JobDoc } from '@/lib/jobs';
import type { Placement } from '@/lib/track';

export async function JobList({
  hits, locale, placement, offset = 0, query, demo,
}: { hits: JobDoc[]; locale: 'tr' | 'en'; placement: Placement; offset?: number; query?: string; demo?: boolean }) {
  const t = await getTranslations('jobs');
  return (
    <>
      {demo && (
        <p role="note" className="mb-3 border border-dashed border-agre-olive bg-agre-lime-tint px-3 py-2 text-[13px] text-agre-navy">
          {t('demoBanner')}
        </p>
      )}
      <ol className="grid gap-3">
        {hits.map((doc, i) => (
          <li key={doc.id}>
            <JobCard job={toCardData(doc, locale)} placement={placement} position={offset + i} query={query} />
          </li>
        ))}
      </ol>
    </>
  );
}
