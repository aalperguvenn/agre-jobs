import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ALL_SUBSECTORS, SECTORS } from '@agre/taxonomy';
import { Link } from '@/i18n/routing';
import { JobSearchBox } from '@/components/search/JobSearchBox';
import { JobList } from '@/components/jobs/JobList';
import { searchJobs } from '@/lib/data';

export const revalidate = 300; // refresh counts and latest roles every 5 minutes

export default async function HomePage({ params }: { params: Promise<{ locale: 'tr' | 'en' }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const latest = await searchJobs({ limit: 6 });

  const stats = [
    { value: latest.total, label: t('hero.statJobs'), show: latest.total > 0 },
    { value: SECTORS.length, label: t('hero.statSectors'), show: true },
    { value: ALL_SUBSECTORS.length, label: t('hero.statSubsectors'), show: true },
  ].filter((s) => s.show);

  return (
    <>
      {/* ── Hero ── */}
      <section className="on-navy relative overflow-hidden bg-agre-navy text-[#E9EAE2]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-8 h-[264px] w-[150px] bg-[url('/brand/symbol_washedolive.png')] bg-contain bg-center bg-no-repeat opacity-[0.12] md:bottom-auto md:right-[max(1.5rem,calc((100%-72rem)/2+1.5rem))] md:top-1/2 md:h-[420px] md:w-[240px] md:-translate-y-1/2 md:opacity-[0.16]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 md:pb-14 md:pt-16">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-agre-lime">{t('hero.eyebrow')}</p>
          <h1 className="mt-3.5 max-w-[22ch] text-[clamp(30px,7.4vw,54px)] font-medium leading-[1.12] text-white">{t('hero.headline')}</h1>
          <p className="mt-5 max-w-[46ch] font-poppins text-[clamp(17px,4.4vw,21px)] leading-snug text-agre-lime">{t('hero.lead')}</p>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[#A9AFA0] md:text-base">{t('hero.description')}</p>
          <div className="mt-7">
            <Suspense>
              <JobSearchBox variant="hero" tone="dark" />
            </Suspense>
          </div>
          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-[#2C3B50] pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="m-0">
                  <b className="block font-poppins text-[26px] font-medium tabular-nums text-white md:text-[28px]">
                    {s.value.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
                  </b>
                  <span className="text-[13px] text-[#A9AFA0]">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-14">
        <div className="mb-5">
          <h2 className="text-2xl font-medium md:text-[28px]">{t('sectors.title')}</h2>
          <p className="mt-1.5 text-agre-muted">{t('sectors.subtitle')}</p>
        </div>
        <ul className="grid gap-px border border-[#DEDED0] bg-[#DEDED0] sm:grid-cols-2 lg:grid-cols-5">
          {SECTORS.map((s) => (
            <li key={s.id} className="bg-white">
              <Link href={{ pathname: '/jobs', query: { sector: s.id } }} className="flex h-full flex-col gap-2 p-5 no-underline hover:bg-[#FBFBF6]">
                <span className="font-poppins text-[16px] font-semibold leading-snug text-agre-ink">{s.label[locale]}</span>
                <span className="flex-1 text-[13.5px] text-agre-muted">
                  {s.subsectors.slice(0, 3).map((x) => x.label[locale]).join(' · ')}
                </span>
                <span className="text-[13px] font-semibold text-agre-navy">{t('sectors.subsectors', { count: s.subsectors.length })} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Latest roles (only when there are any) ── */}
      {latest.hits.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 md:pb-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-medium md:text-[28px]">{t('latest.title')}</h2>
            <Link href="/jobs" className="border-b border-current pb-px text-sm font-semibold no-underline">{t('latest.all')}</Link>
          </div>
          <JobList hits={latest.hits} locale={locale} placement="home" demo={latest.mode === 'demo'} />
        </section>
      )}

      {/* ── Dual CTA ── */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 sm:px-6 md:grid-cols-2">
        <div className="on-navy flex flex-col items-start gap-3 bg-agre-navy p-7 text-[#E9EAE2] md:p-8">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-agre-lime">{t('cta.talentEyebrow')}</p>
          <h2 className="text-[22px] font-medium text-white md:text-2xl">{t('cta.talentTitle')}</h2>
          <p className="max-w-[46ch] text-[#A9AFA0]">{t('cta.talentBody')}</p>
          <Link href="/jobs" className="mt-1 bg-agre-lime px-4 py-2.5 text-sm font-semibold text-agre-navy no-underline hover:bg-[#ECF1BA]">
            {t('cta.talentButton')}
          </Link>
        </div>
        <div className="flex flex-col items-start gap-3 bg-agre-lime p-7 text-agre-navy md:p-8">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em]">{t('cta.employerEyebrow')}</p>
          <h2 className="text-[22px] font-medium md:text-2xl">{t('cta.employerTitle')}</h2>
          <p className="max-w-[46ch]">{t('cta.employerBody')}</p>
          <Link href="/employers" className="mt-1 bg-agre-navy px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#1C2B40]">
            {t('cta.employerButton')}
          </Link>
        </div>
      </section>
    </>
  );
}
