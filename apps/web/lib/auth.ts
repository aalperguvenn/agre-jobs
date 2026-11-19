import 'server-only';

/**
 * Curator access check. WIRE THIS TO YOUR AUTH before deploying /curate:
 * read the signed-in user (Supabase Auth per the architecture notes) and allow only the curator role.
 * Until then it only opens in local development with CURATOR_DEV_BYPASS=1.
 */
export async function requireCurator(): Promise<{ id: string }> {
  if (process.env.NODE_ENV !== 'production' && process.env.CURATOR_DEV_BYPASS === '1') return { id: 'dev-curator' };
  throw new Error('Curator auth not configured: implement requireCurator() in apps/web/lib/auth.ts');
}
