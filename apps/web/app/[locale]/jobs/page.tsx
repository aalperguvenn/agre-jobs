import { MeiliSearch } from 'meilisearch';
import { JobSearchBox } from '@/components/search/JobSearchBox';
import { JobCard } from '@/components/jobs/JobCard';
import { toCardData, type JobDoc } from '@/lib/jobs';

const FILTERABLE = ['sector', 'subsector', 'hub', 'employment_type', 'work_mode', 'function'] as const;

/**
 * Jobs board (PRD P2), the parts this change touches: search box, Popüler row, external-link cards.
 * Filters in the URL (?sector=…&hub=…) map one-to-one to Meilisearch filterable attributes.
 */
export default async function JobsPage({
  params, searchParams,
}: {
  params: Promise<{ locale: 'tr' | 'en' }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = sp.q ?? '';

  const filter = FILTERABLE.flatMap((k) => (sp[k] ? [`${k} = ${JSON.stringify(sp[k])}`] : []));
  const client = new MeiliSearch({ host: process.env.MEILI_HOST!, apiKey: process.env.MEILI_SEARCH_KEY });
  const page = Math.max(1, Number(sp.page ?? 1));
  const res = await client.index<JobDoc>(process.env.MEILI_JOBS_INDEX ?? 'jobs').search(q, {
    filter, hitsPerPage: 30, page, sort: q ? undefined : ['posted_at_ts:desc'], locales: ['tur', 'eng'],
  });
  const placement = sp.from === 'popular' ? 'popular' : 'list';

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <JobSearchBox variant="board" />
      <p className="mt-6 font-montserrat text-sm text-agre-muted">
        {res.totalHits.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-GB')} {locale === 'tr' ? 'ilan' : 'roles'}
      </p>
      <ol className="mt-3 grid gap-3">
        {res.hits.map((doc, i) => (
          <li key={doc.id}>
            <JobCard job={toCardData(doc, locale)} placement={placement} position={(page - 1) * 30 + i} query={q || undefined} />
          </li>
        ))}
      </ol>
    </main>
  );
}
