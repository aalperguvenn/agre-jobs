'use server';

import PgBoss from 'pg-boss';
import { z } from 'zod';
import { CuratorSubmissionError, curatorSubmissionToRaw, type CuratorSubmission } from '@agre/core';
import { requireCurator } from '@/lib/auth';

const Form = z.object({
  url: z.string().url(),
  title: z.string().min(2).max(200),
  company: z.string().min(1).max(200),
  location: z.string().min(2).max(200),
  employment: z.string().max(60).optional(),
  postedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  validThrough: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  note: z.string().max(240).optional(),
});

let boss: PgBoss | undefined;
async function queue() {
  if (!boss) { boss = new PgBoss({ connectionString: process.env.DATABASE_URL! }); await boss.start(); }
  return boss;
}

export type AddState = { ok: boolean; message: string };

/**
 * Curator inbox: add a role found on LinkedIn, Kariyer.net, YeniBirİş or Indeed.
 * Only the URL and the fields the curator types are stored; the posting page is never fetched.
 * The worker's `curator-submission` queue normalizes, tags, dedupes and publishes it.
 */
export async function addCuratedJob(_prev: AddState, form: FormData): Promise<AddState> {
  const curator = await requireCurator();
  const parsed = Form.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };

  const sub: CuratorSubmission = {
    ...parsed.data,
    postedAt: parsed.data.postedAt || undefined,
    validThrough: parsed.data.validThrough || undefined,
    curatorId: curator.id,
  };
  try {
    curatorSubmissionToRaw(sub); // validate early so the curator sees errors now
  } catch (err) {
    if (err instanceof CuratorSubmissionError) return { ok: false, message: err.message };
    throw err;
  }
  await (await queue()).send('curator-submission', sub);
  return { ok: true, message: 'Added. It will appear on the board within a minute.' };
}
