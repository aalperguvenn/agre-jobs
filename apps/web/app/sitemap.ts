import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return ['', '/jobs', '/employers'].flatMap((path) =>
    (['tr', 'en'] as const).map((locale) => ({
      url: `${site}/${locale}${path}`,
      changeFrequency: path === '/jobs' ? ('daily' as const) : ('weekly' as const),
      alternates: { languages: { tr: `${site}/tr${path}`, en: `${site}/en${path}` } },
    })),
  );
}
