'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Logo } from './Logo';

export function Masthead() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/jobs', label: t('jobs') },
    { href: '/employers', label: t('employers') },
  ] as const;

  return (
    <header className="on-navy sticky top-0 z-40 border-b border-[#2C3B50] bg-agre-navy text-[#E9EAE2]">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo byline={t('byHub')} />

        <nav
          id="main-nav"
          aria-label={t('menu')}
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 flex-col border-b border-[#2C3B50] bg-agre-navy px-4 pb-4 pt-2 md:static md:flex md:flex-1 md:flex-row md:gap-1 md:border-0 md:p-0`}
        >
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`px-1 py-2.5 text-[15px] font-medium no-underline md:px-3 md:text-sm ${
                  active ? 'text-white md:shadow-[inset_0_-2px_0_#E2EA99]' : 'text-[#E9EAE2] hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div role="group" aria-label={t('language')} className="flex border border-[#2C3B50]">
            {(['tr', 'en'] as const).map((l) => (
              <Link
                key={l}
                href={pathname}
                locale={l}
                aria-current={locale === l ? 'true' : undefined}
                lang={l}
                className={`px-2.5 py-1.5 text-xs font-semibold tracking-wide no-underline ${
                  locale === l ? 'bg-agre-lime text-agre-navy' : 'text-[#A9AFA0] hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
          <Link
            href="/employers"
            className="hidden bg-agre-lime px-3 py-2 text-[13px] font-semibold text-agre-navy no-underline hover:bg-[#ECF1BA] sm:inline-flex"
          >
            {t('postJob')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="main-nav"
            className="inline-flex items-center gap-1.5 border border-[#2C3B50] px-2.5 py-1.5 text-[13px] font-semibold text-white md:hidden"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
            {t('menu')}
          </button>
        </div>
      </div>
    </header>
  );
}
