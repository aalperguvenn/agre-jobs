'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { POPULAR_HEADING, POPULAR_TAGS } from '@agre/taxonomy';
import { trackEvent } from '@/lib/track';

interface Props {
  /**
   * 'board': filters the Jobs board in place (keeps other filters, resets paging).
   * 'hero':  navigates from the landing page to the Jobs board with the query.
   */
  variant: 'board' | 'hero';
  /** Optional: lets the search box mirror the tag immediately. */
  onQueryChange?: (q: string) => void;
  /** 'dark' on the navy hero, 'light' on paper. */
  tone?: 'dark' | 'light';
}

/**
 * Popüler row directly under the search box: exactly five tags, fixed order, fixed labels
 * (see packages/taxonomy/src/popular-tags.ts). Clicking sets ?q=<label>; clicking the active tag clears it.
 */
export function PopularTags({ variant, onQueryChange, tone = 'light' }: Props) {
  const dark = tone === 'dark';
  const locale = useLocale() as 'tr' | 'en';
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeQuery = params.get('q') ?? '';

  function select(query: string, tagId: string) {
    const isActive = activeQuery === query;
    const next = isActive ? '' : query;
    onQueryChange?.(next);
    trackEvent('popular_tag_click', { tag: tagId, locale, action: isActive ? 'clear' : 'select' });

    if (variant === 'hero') {
      if (next) router.push(`/${locale}/jobs?q=${encodeURIComponent(next)}`);
      return;
    }
    const sp = new URLSearchParams(params.toString());
    if (next) sp.set('q', next); else sp.delete('q');
    sp.delete('page');
    sp.set('from', 'popular');                 // lets result cards report placement=popular
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <nav aria-label={locale === 'tr' ? 'Popüler aramalar' : 'Popular searches'} className="mt-3 flex flex-wrap items-center gap-2">
      <span className={`mr-1 font-montserrat text-xs font-semibold uppercase tracking-[0.08em] ${dark ? 'text-[#A9AFA0]' : 'text-agre-muted'}`}>
        {POPULAR_HEADING[locale]}
      </span>
      {POPULAR_TAGS.map((tag) => {
        const active = activeQuery === tag.query;
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={active}
            onClick={() => select(tag.query, tag.id)}
            className={[
              'rounded-full border px-3 py-1.5 font-montserrat text-[13px] transition-colors',
              dark ? 'focus-visible:outline-agre-lime' : 'focus-visible:outline-agre-navy',
              active
                ? 'border-agre-lime bg-agre-lime font-semibold text-agre-navy'
                : dark
                  ? 'border-[#2C3B50] bg-transparent text-[#E9EAE2] hover:border-agre-lime hover:text-white'
                  : 'border-agre-sage/40 bg-white text-agre-ink hover:border-agre-navy',
            ].join(' ')}
          >
            {tag.label}
          </button>
        );
      })}
    </nav>
  );
}
