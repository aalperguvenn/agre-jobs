import { canonicalizeJobUrl } from './canonical-url';
import { classifyFunction, classifyListing } from './classify';
import { detectEmploymentType, detectWorkMode } from './employment';
import { jobFingerprint } from './fingerprint';
import { locate } from './locate';
import { normalizeCompany, snippet } from './text';
import type { NormalizedListing, RawListing } from './types';

/**
 * One raw listing → one tagged, comparable listing. Pure: no I/O.
 * Every source goes through this, so curator-added LinkedIn roles and API results end up identical in shape.
 */
export function normalizeListing(raw: RawListing): NormalizedListing {
  const title = raw.title.replace(/\s+/g, ' ').trim();
  const companyName = raw.company.replace(/\s+/g, ' ').trim();
  const descriptionSnippet = snippet(raw.descriptionHtml);
  const { canonicalUrl, platform, platformJobId } = canonicalizeJobUrl(raw.url);

  const location = locate(raw.locationText, { remoteHint: raw.remoteHint });
  const workMode = detectWorkMode({ remoteHint: raw.remoteHint, texts: [raw.locationText, title, raw.employmentHint] });
  const employmentType = detectEmploymentType(raw.employmentHint, title, descriptionSnippet);
  const classification = classifyListing({ title, company: companyName, description: descriptionSnippet });

  // Native and feed sources are the original platform themselves.
  const originalPlatform =
    raw.source === 'native' ? 'agre_jobs'
    : raw.source === 'ats' || raw.source === 'employer_feed' ? 'company_site'
    : platform;

  return {
    raw,
    title,
    companyName,
    companyNormalized: normalizeCompany(companyName),
    canonicalUrl,
    originalPlatform,
    platformJobId,
    classification,
    function: classifyFunction(title),
    employmentType,
    workMode,
    location,
    fingerprint: jobFingerprint({
      company: companyName,
      title,
      province: location?.province,
      city: location?.city,
      remote: workMode === 'remote',
    }),
    descriptionSnippet,
  };
}
