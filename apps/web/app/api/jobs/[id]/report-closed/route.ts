import { NextResponse } from 'next/server';
import { z } from 'zod';
import { reportClosed } from '@agre/db';
import { dailySessionHash } from '@/lib/session';

/** "İlan kapandı mı?" — one report per session per job; the second distinct report closes the job. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  const result = await reportClosed(id, await dailySessionHash());
  return NextResponse.json(result);
}
