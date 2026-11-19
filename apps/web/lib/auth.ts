import 'server-only';
import { notFound } from 'next/navigation';

/**
 * Curator access check. WIRE THIS TO YOUR AUTH before using /curate in production:
 * read the signed-in user (Supabase Auth per the architecture notes) and allow only the curator role.
 * Until then /curate answers "not found" everywhere except local development with CURATOR_DEV_BYPASS=1.
 */
export async function requireCurator(): Promise<{ id: string }> {
  if (process.env.NODE_ENV !== 'production' && process.env.CURATOR_DEV_BYPASS === '1') return { id: 'dev-curator' };
  notFound();
}
