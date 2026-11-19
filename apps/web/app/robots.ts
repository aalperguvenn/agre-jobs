import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  // Preview deployments stay out of search engines; production is indexable except curator tools.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/tr/curate', '/en/curate'] },
    sitemap: site ? `${site}/sitemap.xml` : undefined,
  };
}
