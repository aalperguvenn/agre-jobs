'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { PopularTags } from './PopularTags';

/**
 * Search box + Popüler row. The query lives in the URL (?q=), so tags, typing, sharing and Back all agree.
 * variant='hero' (landing page) navigates to the board; variant='board' filters in place.
 */
export function JobSearchBox({ variant }: { variant: 'hero' | 'board' }) {
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
    <div>
      <form role="search" onSubmit={submit} className="flex gap-2">
        <label htmlFor="job-q" className="sr-only">{locale === 'tr' ? 'Pozisyon' : 'Position'}</label>
        <input
          id="job-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={locale === 'tr' ? 'Pozisyon, beceri veya kurum' : 'Role, skill or organization'}
          className="h-12 flex-1 rounded-[4px] border border-agre-sage/40 bg-white px-4 font-montserrat text-[15px] text-agre-ink placeholder:text-agre-muted focus:border-agre-navy focus:outline-none"
        />
        <button type="submit" className="h-12 rounded-[4px] bg-agre-lime px-5 font-poppins text-[15px] font-medium text-agre-navy hover:brightness-95">
          {locale === 'tr' ? 'Ara' : 'Search'}
        </button>
      </form>
      <PopularTags variant={variant} onQueryChange={setQ} />
    </div>
  );
}
