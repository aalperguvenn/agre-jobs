import { NextResponse } from 'next/server';
import { z } from 'zod';
import { insertClick } from '@agre/db';
import { PLATFORMS } from '@agre/taxonomy';
import { dailySessionHash } from '@/lib/session';

const Click = z.object({
  jobId: z.string().uuid(),
  jobSourceId: z.string().uuid().optional(),
  platform: z.enum(Object.keys(PLATFORMS) as [string, ...string[]]),
  placement: z.enum(['list', 'home', 'popular', 'organization', 'email', 'other']),
  position: z.number().int().min(0).max(10_000).optional(),
  query: z.string().max(200).optional(),
  locale: z.enum(['tr', 'en']),
});

/** Receives sendBeacon posts from JobCard. Always 204: telemetry must never surface errors to users. */
export async function POST(req: Request) {
  try {
    const parsed = Click.safeParse(await req.json());
    if (parsed.success) {
      await insertClick({ ...parsed.data, sessionHash: await dailySessionHash() });
    }
  } catch (err) {
    console.error('[clicks]', err);
  }
  return new NextResponse(null, { status: 204 });
}
