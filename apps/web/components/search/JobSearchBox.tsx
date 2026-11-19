'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { PopularTags } from './PopularTags';

/**
 * Search box + Popüler row. The query lives in the URL (?q=), so tags, typing, sharing and Back all agree.
 * variant='hero' (landing page) navigates to the board; variant='board' filters in place and keeps filters.
 */
export function JobSearchBox({ variant, tone = 'light' }: { variant: 'hero' | 'board'; tone?: 'dark' | 'light' }) {
  const locale = useLocale() as 'tr' | 'en';
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  useEffect(() => { setQ(params.get('q') ?? ''); }, [params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (variant === 'hero') { router.push(`/${locale}/jobs${q ? `?q=${encodeURIComponent(q)}` : ''}`); return; }
    const sp = new URLSearchParams(params.toString());
    if (q) sp.set('q', q); else sp.delete('q');
    sp.delete('page');
    sp.delete('from');            // typed queries are not "popular" placements
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-[860px]">
      <form role="search" onSubmit={submit} className="flex flex-col border border-white bg-white sm:flex-row">
        <label htmlFor={`job-q-${variant}`} className="flex flex-1 flex-col px-4 py-2.5 focus-within:shadow-[inset_0_0_0_2px_#121E2E]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-agre-muted">
            {locale === 'tr' ? 'Pozisyon' : 'Position'}
          </span>
          <input
            id={`job-q-${variant}`} type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={locale === 'tr' ? 'Pozisyon, beceri veya kurum' : 'Role, skill or organization'}
            className="w-full border-0 bg-transparent pt-0.5 text-base text-agre-ink outline-none placeholder:text-[#7C7B6C]"
          />
        </label>
        <button type="submit" className="bg-agre-lime px-7 py-3.5 font-poppins text-[15px] font-semibold text-agre-navy hover:bg-[#ECF1BA]">
          {locale === 'tr' ? 'İş bul' : 'Find jobs'}
        </button>
      </form>
      <PopularTags variant={variant} onQueryChange={setQ} tone={tone} />
    </div>
  );
}
