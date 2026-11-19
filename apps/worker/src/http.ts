/** Polite HTTP: identifying user agent, timeout, retries with backoff on 429/5xx, and a per-host delay. */

export const USER_AGENT =
  process.env.AGRE_USER_AGENT ?? 'AgreJobsBot/1.0';  // set AGRE_USER_AGENT with a bot-info URL and contact

const lastCall = new Map<string, number>();

export async function politeFetch(
  url: string,
  init: RequestInit & { minIntervalMs?: number; retries?: number; timeoutMs?: number } = {},
): Promise<Response> {
  const { minIntervalMs = 1000, retries = 3, timeoutMs = 20_000, ...rest } = init;
  const host = new URL(url).host;

  for (let attempt = 0; ; attempt++) {
    const wait = (lastCall.get(host) ?? 0) + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall.set(host, Date.now());

    try {
      const res = await fetch(url, {
        ...rest,
        headers: { 'user-agent': USER_AGENT, accept: 'application/json, text/html;q=0.8', ...(rest.headers ?? {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const retryAfter = Number(res.headers.get('retry-after')) * 1000;
        await sleep(retryAfter > 0 ? retryAfter : 2 ** attempt * 2000);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(2 ** attempt * 2000);
    }
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
