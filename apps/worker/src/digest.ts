import { buildSavedSearches } from '@agre/core';
import { getPool, openCurationCounts } from '@agre/db';

/**
 * Monday curator digest: last run's numbers, the open review queue, clicks by platform,
 * and this week's saved searches on LinkedIn, Kariyer.net, YeniBirİş and Indeed.
 * Sent with Resend if RESEND_API_KEY is set; otherwise printed.
 */
export async function sendCuratorDigest() {
  const db = getPool();
  const { rows: [run] } = await db.query<{ started_at: Date; status: string; stats: Record<string, unknown> }>(
    `select started_at, status, stats from ingestion_runs where trigger = 'cron' order by started_at desc limit 1`);
  const queue = await openCurationCounts();
  const { rows: clicks } = await db.query<{ platform: string; n: string }>(
    `select platform, count(*) n from job_clicks where created_at > now() - interval '7 days' group by platform order by n desc`);

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const searches = buildSavedSearches('tr');
  const searchRows = searches.map((s) =>
    `<tr><td>${esc(s.label)}</td><td><b>${esc(s.query)}</b></td><td>${s.links
      .map((l) => `<a href="${l.url}">${esc(l.label)}</a>`).join(' · ')}</td></tr>`).join('');

  const html = `
  <h2>Agre Jobs — haftalık küratör özeti</h2>
  <p>Son çalışma: ${run ? `${run.started_at.toISOString().slice(0, 16)} · ${run.status}` : 'yok'}</p>
  <pre>${esc(JSON.stringify(run?.stats ?? {}, null, 2))}</pre>
  <h3>İnceleme kuyruğu</h3>
  <ul>${Object.entries(queue).map(([k, n]) => `<li>${k}: ${n}</li>`).join('') || '<li>Boş</li>'}</ul>
  <p><a href="${appUrl}/tr/curate">Kuyruğu aç</a> · <a href="${appUrl}/tr/curate/add">İlan ekle</a></p>
  <h3>Son 7 gün tıklamalar (platforma göre)</h3>
  <ul>${clicks.map((c) => `<li>${esc(c.platform)}: ${c.n}</li>`).join('') || '<li>—</li>'}</ul>
  <h3>Bu haftanın aramaları (LinkedIn · Kariyer.net · YeniBirİş · Indeed)</h3>
  <p>Her bağlantı platformun kendi arama sayfasını açar. Uygun ilanları ${appUrl}/tr/curate/add üzerinden ekleyin.</p>
  <table>${searchRows}</table>`;

  const to = (process.env.CURATOR_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!process.env.RESEND_API_KEY || to.length === 0 || !process.env.DIGEST_FROM) {
    console.log('[digest] RESEND_API_KEY, CURATOR_EMAILS or DIGEST_FROM not set; digest not sent', { queue, searches: searches.length });
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.DIGEST_FROM,
      to, subject: `Agre Jobs küratör özeti · ${new Date().toISOString().slice(0, 10)}`, html,
    }),
  });
  if (!res.ok) throw new Error(`Digest send failed: HTTP ${res.status} ${await res.text()}`);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
