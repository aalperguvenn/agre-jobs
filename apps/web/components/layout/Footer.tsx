import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Logo } from './Logo';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const hubUrl = process.env.NEXT_PUBLIC_AGRE_HUB_URL;

  return (
    <footer className="on-navy bg-agre-navy py-10 text-[13.5px] text-[#A9AFA0]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo large />
          <p className="mt-3 max-w-[40ch]">{t('about')}</p>
        </div>
        <div>
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white">{t('explore')}</h2>
          <ul className="space-y-1">
            <li><Link href="/jobs" className="text-[#E9EAE2] no-underline hover:text-agre-lime">{nav('jobs')}</Link></li>
            <li><Link href="/employers" className="text-[#E9EAE2] no-underline hover:text-agre-lime">{nav('employers')}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white">{t('company')}</h2>
          {hubUrl ? (
            <a href={hubUrl} className="text-[#E9EAE2] no-underline hover:text-agre-lime">{nav('hub')}</a>
          ) : (
            <span className="text-[#E9EAE2]">{nav('hub')}</span>
          )}
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-between gap-2 border-t border-[#2C3B50] px-4 pt-5 sm:px-6">
        <span>{t('rights', { year: new Date().getFullYear() })}</span>
        <span>{t('sources')}</span>
      </div>
    </footer>
  );
}
