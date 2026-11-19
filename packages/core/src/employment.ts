import type { EmploymentType, WorkMode } from '@agre/taxonomy';
import { containsPhrase, fold } from './text';

const RULES: [EmploymentType, string[]][] = [
  ['seasonal', ['sezonluk', 'sezon', 'seasonal', 'hasat', 'harvest', 'yazlik', 'summer season']],
  ['internship', ['stajyer', 'staj', 'intern', 'internship', 'trainee']],
  ['stage', ['mutfak stage', 'kitchen stage', 'stage chef', 'trial shift', 'deneme vardiyasi']],
  ['apprenticeship', ['cirak', 'ciraklik', 'apprentice', 'apprenticeship']],
  ['fellowship', ['fellowship', 'fellow', 'burs programi']],
  ['volunteer', ['gonullu', 'volunteer', 'volunteering']],
  ['part_time', ['yari zamanli', 'part time', 'part-time', 'parttime']],
  ['project_freelance', ['freelance', 'serbest', 'proje bazli', 'contract', 'sozlesmeli', 'temporary', 'gecici']],
  ['full_time', ['tam zamanli', 'full time', 'full-time', 'permanent', 'kadrolu']],
];

/** Source field first (it is the employer's own value), then title, then description. */
export function detectEmploymentType(...texts: (string | undefined)[]): EmploymentType {
  for (const raw of texts) {
    if (!raw) continue;
    const t = fold(raw);
    for (const [type, words] of RULES) {
      if (words.some((w) => containsPhrase(t, fold(w)))) return type;
    }
  }
  return 'full_time';
}

export function detectWorkMode(opts: { remoteHint?: boolean; texts: (string | undefined)[] }): WorkMode {
  const t = fold(opts.texts.filter(Boolean).join(' '));
  if (['hibrit', 'hybrid'].some((w) => containsPhrase(t, w))) return 'hybrid';
  if (opts.remoteHint || ['uzaktan', 'remote', 'evden calisma'].some((w) => containsPhrase(t, fold(w)))) return 'remote';
  if (['gezici', 'saha satis', 'travelling', 'traveling', 'field sales'].some((w) => containsPhrase(t, fold(w)))) {
    return 'travelling';
  }
  return 'on_site';
}

/** Careerjet contract_type / work_hours codes → our types. */
export function fromCareerjetCodes(contract?: string, hours?: string): string | undefined {
  const map: Record<string, string> = { p: 'permanent', c: 'contract', t: 'temporary', i: 'internship', v: 'volunteer' };
  const parts = [contract ? map[contract] : undefined, hours === 'p' ? 'part time' : undefined].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}
