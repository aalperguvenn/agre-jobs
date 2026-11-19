/**
 * The Popüler row under the search box. Exactly these five tags, in this order,
 * with these labels in both TR and EN UIs. Only the row heading is translated.
 *
 * `synonyms` are pushed to Meilisearch so the English labels also find Turkish titles.
 */
export interface PopularTag {
  id: string;
  label: string;
  query: string;
  synonyms: string[];
}

export const POPULAR_TAGS: readonly PopularTag[] = [
  {
    id: 'food-scientist',
    label: 'Food Scientist',
    query: 'Food Scientist',
    synonyms: ['gıda bilimci', 'gıda mühendisi', 'gıda teknoloğu', 'food technologist'],
  },
  {
    id: 'rnd-chef',
    label: 'R&D Chef',
    query: 'R&D Chef',
    synonyms: ['Ar-Ge şefi', 'araştırma geliştirme şefi', 'development chef', 'culinary R&D', 'research chef'],
  },
  {
    id: 'food-innovation-consultant',
    label: 'Food Innovation Consultant',
    query: 'Food Innovation Consultant',
    synonyms: ['gıda inovasyon danışmanı', 'ürün geliştirme danışmanı', 'food innovation'],
  },
  {
    id: 'culinary-tour-host',
    label: 'Culinary Tour Host',
    query: 'Culinary Tour Host',
    synonyms: ['gastronomi turu rehberi', 'yemek turu', 'food tour guide', 'culinary guide'],
  },
  {
    id: 'food-entrepreneur',
    label: 'Food Entrepreneur',
    query: 'Food Entrepreneur',
    synonyms: ['gıda girişimcisi', 'gıda girişimi kurucusu'],
  },
] as const;

/** Popüler heading per locale. */
export const POPULAR_HEADING = { tr: 'Popüler', en: 'Popular' } as const;
