import { NextResponse } from 'next/server';

/**
 * Product events (e.g. popular_tag_click). Forward to your analytics tool here;
 * kept as a no-op logger so the client contract exists from day one.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string };
    if (body?.name === 'popular_tag_click') console.log('[event]', JSON.stringify(body));
  } catch { /* ignore */ }
  return new NextResponse(null, { status: 204 });
}
