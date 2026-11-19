import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HUBS, SECTORS, type HubId } from '@agre/taxonomy';
import { Link } from '@/i18n/routing';
import { JobSearchBox } from '@/components/search/JobSearchBox';
import { JobList } from '@/components/jobs/JobList';
import { FILTER_KEYS, PAGE_SIZE, searchJobs, type FilterKey } from '@/lib/data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs' });
  return { title: t('title'), description: t('subtitle') };
}

const TR_HUBS: HubId[] = ['istanbul-marmara', 'izmir-ege', 'antalya-akdeniz', 'ankara-ic-anadolu', 'karadeniz', 'guneydogu-gap', 'dogu-anadolu', 'trakya'];
const ABROAD_HUBS: HubId[] = ['balkans', 'caucasus', 'middle-east-gulf', 'northern-cyprus', 'europe', 'remote'];
const EMPLOYMENT = {
  tr: { full_time: 'Tam zamanlı', part_time: 'Yarı zamanlı', seasonal: 'Sezonluk', project_freelance: 'Proje / serbest', internship: 'Staj', fellowship: 'Fellowship' },
  en: { full_time: 'Full-time', part_time: 'Part-time', seasonal: 'Seasonal', project_freelance: 'Project & freelance', internship: 'Internship', fellowship: 'Fellowship' },
};

/** Jobs board (PRD P2): search + Popüler row, filters in the URL, cards that link out to the original posting. */
export default async function JobsPage({
  params, searchParams,
}: {
  params: Promise<{ locale: 'tr' | 'en' }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('jobs');
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);

  const q = one('q') ?? '';
  const page = Math.max(1, Number(one('page') ?? 1) || 1);
  const filters = Object.fromEntries(FILTER_KEYS.flatMap((k) => (one(k) ? [[k, one(k)!]] : []))) as Partial<Record<FilterKey, string>>;
  const result = await searchJobs({ q, filters, page });
  const placement = one('from') === 'popular' ? 'popular' : 'list';
  const pages = Math.ceil(result.total / PAGE_SIZE);
  const hasFilters = q || Object.keys(filters).length > 0;

  const pageHref = (p: number) => ({ pathname: '/jobs' as const, query: { ...(q && { q }), ...filters, page: String(p) } });
  const select = 'w-full border border-[#C9C9B8] bg-white px-3 py-2 text-sm text-agre-ink sm:w-auto';

  return (
    <>
      <section className="on-navy bg-agre-navy text-[#E9EAE2]">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
          <h1 className="text-[26px] font-medium text-white md:text-[30px]">{t('title')}</h1>
          <p className="mt-1.5 text-[#A9AFA0]">{t('subtitle')}</p>
          <div className="mt-5">
            <Suspense>
              <JobSearchBox variant="board" tone="dark" />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Filters: a plain GET form, so it works without JavaScript */}
        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" aria-label={t('filters')}>
          {q && <input type="hidden" name="q" value={q} />}
          <select name="sector" defaultValue={filters.sector ?? ''} className={select} aria-label={t('allSectors')}>
            <option value="">{t('allSectors')}</option>
            {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label[locale]}</option>)}
          </select>
          <select name="hub" defaultValue={filters.hub ?? ''} className={select} aria-label={t('allHubs')}>
            <option value="">{t('allHubs')}</option>
            <optgroup label="Türkiye">
              {TR_HUBS.map((h) => <option key={h} value={h}>{HUBS[h][locale]}</option>)}
            </optgroup>
            <optgroup label={locale === 'tr' ? 'Bölge' : 'Region'}>
              {ABROAD_HUBS.map((h) => <option key={h} value={h}>{HUBS[h][locale]}</option>)}
            </optgroup>
          </select>
          <select name="employment_type" defaultValue={filters.employment_type ?? ''} className={select} aria-label={t('allTypes')}>
            <option value="">{t('allTypes')}</option>
            {Object.entries(EMPLOYMENT[locale]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" className="bg-agre-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#1C2B40]">{t('apply')}</button>
          {hasFilters && (
            <Link href="/jobs" className="text-sm text-agre-muted underline underline-offset-2">{t('clear')}</Link>
          )}
        </form>

        <p className="mb-3 mt-5 font-semibold" aria-live="polite">{t('count', { count: result.total })}</p>

        {result.hits.length > 0 ? (
          <JobList
            hits={result.hits} locale={locale} placement={placement}
            offset={(page - 1) * PAGE_SIZE} query={q || undefined} demo={result.mode === 'demo'}
          />
        ) : (
          <div className="border border-dashed border-agre-olive bg-white px-5 py-10 text-center text-agre-muted">
            <b className="mb-1.5 block font-poppins text-lg font-medium text-agre-ink">
              {hasFilters && result.mode !== 'empty' ? t('noResultsTitle') : t('emptyTitle')}
            </b>
            <p className="mx-auto max-w-[56ch]">{hasFilters && result.mode !== 'empty' ? t('noResultsBody') : t('emptyBody')}</p>
            {!(hasFilters && result.mode !== 'empty') && (
              <Link href="/employers" className="mt-4 inline-block bg-agre-lime px-4 py-2.5 text-sm font-semibold text-agre-navy no-underline">
                {locale === 'tr' ? 'İlan ver' : 'Post a job'}
              </Link>
            )}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
            {page > 1 ? <Link href={pageHref(page - 1)} className="text-sm font-semibold">← {t('previous')}</Link> : <span />}
            <span className="text-sm text-agre-muted tabular-nums">{page} / {pages}</span>
            {page < pages ? <Link href={pageHref(page + 1)} className="text-sm font-semibold">{t('next')} →</Link> : <span />}
          </nav>
        )}
      </section>
    </>
  );
}
