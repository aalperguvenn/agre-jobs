import type { PlatformKey } from '@agre/taxonomy';

/** Query parameters that only track a visit; dropped from canonical URLs. */
const TRACKING_PARAMS = [
  /^utm_/i, /^trk$/i, /^trkInfo$/i, /^refId$/i, /^trackingId$/i, /^gclid$/i, /^fbclid$/i,
  /^msclkid$/i, /^mc_[a-z]+$/i, /^ref$/i, /^source$/i, /^src$/i, /^from$/i, /^tk$/i, /^vjs$/i,
  /^advn$/i, /^adid$/i, /^ebp$/i, /^lipi$/i, /^originalSubdomain$/i, /^position$/i, /^pageNum$/i,
];

export interface CanonicalResult {
  canonicalUrl: string;
  platform: PlatformKey;
  /** The platform's own job ID when it can be read from the URL. */
  platformJobId?: string;
}

/**
 * Normalize a job URL so the same posting always produces the same string, and detect
 * which platform it lives on. Never fetches the URL.
 */
export function canonicalizeJobUrl(input: string): CanonicalResult {
  const url = new URL(input.trim());
  url.protocol = 'https:';
  url.hash = '';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  const host = url.hostname;

  // LinkedIn: /jobs/view/<slug>-<id>/ or ?currentJobId=<id> → https://linkedin.com/jobs/view/<id>
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    const id =
      url.searchParams.get('currentJobId') ??
      url.pathname.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})/)?.[1];
    if (id) return { canonicalUrl: `https://linkedin.com/jobs/view/${id}`, platform: 'linkedin', platformJobId: id };
    return { canonicalUrl: stripTracking(url, 'linkedin.com'), platform: 'linkedin' };
  }

  // Indeed: /viewjob?jk=<id> or /rc/clk?jk=<id> or ?vjk=<id> → https://<country>.indeed.com/viewjob?jk=<id>
  if (host === 'indeed.com' || host.endsWith('.indeed.com')) {
    const jk = url.searchParams.get('jk') ?? url.searchParams.get('vjk');
    if (jk) return { canonicalUrl: `https://${host}/viewjob?jk=${jk}`, platform: 'indeed', platformJobId: jk };
    return { canonicalUrl: stripTracking(url, host), platform: 'indeed' };
  }

  // Kariyer.net: /is-ilani/<slug>-<id>
  if (host === 'kariyer.net' || host.endsWith('.kariyer.net')) {
    const id = url.pathname.match(/\/is-ilani\/.*?-(\d{5,})\/?$/)?.[1];
    const path = url.pathname.replace(/\/+$/, '');
    return { canonicalUrl: `https://kariyer.net${path}`, platform: 'kariyer_net', platformJobId: id };
  }

  // YeniBiriş: /is-ilani/<slug>/<id> or ...-<id>
  if (host === 'yenibiris.com' || host.endsWith('.yenibiris.com')) {
    const id = url.pathname.match(/(\d{5,})\/?$/)?.[1];
    const path = url.pathname.replace(/\/+$/, '');
    return { canonicalUrl: `https://yenibiris.com${path}`, platform: 'yenibiris', platformJobId: id };
  }

  if (host.includes('careerjet') || host.includes('jobviewtrack')) {
    return { canonicalUrl: stripTracking(url, host), platform: 'careerjet' };
  }

  return { canonicalUrl: stripTracking(url, host), platform: 'company_site' };
}

function stripTracking(url: URL, host: string): string {
  const kept: [string, string][] = [];
  url.searchParams.forEach((value, key) => {
    if (!TRACKING_PARAMS.some((re) => re.test(key))) kept.push([key, value]);
  });
  kept.sort(([a], [b]) => a.localeCompare(b));
  const qs = kept.length ? `?${new URLSearchParams(kept).toString()}` : '';
  const path = url.pathname.replace(/\/+$/, '') || '';
  return `https://${host}${path}${qs}`;
}

/** Add Agre Jobs referral parameters to company-site links only (Section 5 of the outline). */
export function withReferral(url: string, platform: PlatformKey): string {
  if (platform !== 'company_site') return url;
  const u = new URL(url);
  u.searchParams.set('utm_source', 'agrejobs');
  u.searchParams.set('utm_medium', 'referral');
  return u.toString();
}
