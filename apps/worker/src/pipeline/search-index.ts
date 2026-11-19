import { MeiliSearch } from 'meilisearch';
import { ALL_SUBSECTORS, HUBS, POPULAR_TAGS, type HubId } from '@agre/taxonomy';
import { visibleJobs } from '@agre/db';

const INDEX = process.env.MEILI_JOBS_INDEX ?? 'jobs';

/** Meilisearch synonyms: each Popüler label ↔ its Turkish/English synonyms (both directions). */
export function popularSynonyms(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const tag of POPULAR_TAGS) {
    const label = tag.label.toLowerCase();
    map[label] = tag.synonyms.map((s) => s.toLocaleLowerCase('tr-TR'));
    for (const syn of tag.synonyms) {
      const key = syn.toLocaleLowerCase('tr-TR');
      map[key] = [...new Set([...(map[key] ?? []), label])];
    }
  }
  return map;
}

const SUB = new Map(ALL_SUBSECTORS.map((s) => [s.id, s]));

/**
 * Rebuild the jobs index from Postgres and swap it in atomically, so the board never shows a half-built index.
 * Visible = status active/stale and not waiting for review.
 */
export async function rebuildSearchIndex(): Promise<number> {
  const client = new MeiliSearch({ host: process.env.MEILI_HOST!, apiKey: process.env.MEILI_ADMIN_KEY });
  const tmp = `${INDEX}_next`;

  await client.deleteIndexIfExists(tmp);
  await client.waitForTask((await client.createIndex(tmp, { primaryKey: 'id' })).taskUid);
  const index = client.index(tmp);

  await client.waitForTask((await index.updateSettings({
    searchableAttributes: ['title', 'company_name', 'subsector_tr', 'subsector_en', 'city', 'province'],
    filterableAttributes: ['sector', 'subsector', 'hub', 'employment_type', 'work_mode', 'function', 'original_platform', 'is_native'],
    sortableAttributes: ['posted_at_ts'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'posted_at_ts:desc'],
    synonyms: popularSynonyms(),
    localizedAttributes: [{ attributePatterns: ['*'], locales: ['tur', 'eng'] }],
  })).taskUid);

  const jobs = await visibleJobs();
  const docs = jobs.map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    company_name: j.company_name,
    sector: j.sector,
    subsector: j.subsector,
    subsector_tr: j.subsector ? SUB.get(j.subsector)?.label.tr : null,
    subsector_en: j.subsector ? SUB.get(j.subsector)?.label.en : null,
    function: j.function,
    employment_type: j.employment_type,
    work_mode: j.work_mode,
    city: j.city,
    province: j.province,
    hub: j.hub,
    hub_label: j.hub ? HUBS[j.hub as HubId] : null,
    is_native: j.is_native,
    posted_at_ts: j.posted_at ? new Date(j.posted_at).getTime() / 1000 : 0,
    url: j.primary_url,
    original_platform: j.primary_platform,
    job_source_id: j.primary_source_id,
    also_on: j.also_on,
  }));

  for (let i = 0; i < docs.length; i += 1000) {
    await client.waitForTask((await index.addDocuments(docs.slice(i, i + 1000))).taskUid);
  }

  const exists = await client.getIndex(INDEX).then(() => true, () => false);
  if (!exists) await client.waitForTask((await client.createIndex(INDEX, { primaryKey: 'id' })).taskUid);
  await client.waitForTask((await client.swapIndexes([{ indexes: [INDEX, tmp] }])).taskUid);
  await client.deleteIndexIfExists(tmp);
  return docs.length;
}
