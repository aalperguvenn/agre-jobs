import { ALL_SUBSECTORS, FUNCTIONS, NEGATIVE_KEYWORDS, type FunctionId } from '@agre/taxonomy';
import type { Classification } from './types';
import { containsPhrase, fold } from './text';

export const CLASSIFY_THRESHOLDS = {
  /** Minimum weighted score to place a job in a subsector at all. */
  minScore: 3,
  /** Below this confidence the job goes to the curation queue instead of being published. */
  reviewBelow: 0.6,
} as const;

const TITLE_WEIGHT = 3;
const BODY_WEIGHT = 1;

/** Pre-folded keyword index, built once. */
const INDEX = ALL_SUBSECTORS.map((sub) => ({
  sectorId: sub.sectorId,
  subsectorId: sub.id,
  keywords: [...new Set([...sub.keywordsTr, ...sub.keywordsEn].map(fold))],
}));
const NEGATIVES = NEGATIVE_KEYWORDS.map(fold);

/**
 * Rule-based sector/subsector tagging (PRD Section 2).
 * Title matches weigh 3, company and description snippet matches weigh 1.
 * Highest-scoring subsector wins; confidence = top / (top + runner-up).
 */
export function classifyListing(input: { title: string; company?: string; description?: string }): Classification {
  const title = fold(input.title);
  const body = fold(`${input.company ?? ''} ${input.description ?? ''}`);

  if (NEGATIVES.some((n) => containsPhrase(title, n))) {
    return { score: 0, confidence: 1, decision: 'reject', matched: [] };
  }

  const scored = INDEX.map((entry) => {
    let score = 0;
    const matched: string[] = [];
    for (const kw of entry.keywords) {
      if (containsPhrase(title, kw)) { score += TITLE_WEIGHT; matched.push(kw); }
      else if (containsPhrase(body, kw)) { score += BODY_WEIGHT; matched.push(kw); }
    }
    return { ...entry, score, matched };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];
  if (!top || top.score === 0) return { score: 0, confidence: 1, decision: 'reject', matched: [] };

  const confidence = top.score / (top.score + (second?.score ?? 0));
  const decision =
    top.score < CLASSIFY_THRESHOLDS.minScore || confidence < CLASSIFY_THRESHOLDS.reviewBelow ? 'review' : 'accept';

  return {
    sector: top.sectorId,
    subsector: top.subsectorId,
    score: top.score,
    confidence: Number(confidence.toFixed(2)),
    decision,
    matched: top.matched,
  };
}

const FUNCTION_INDEX = FUNCTIONS.map((f) => ({ id: f.id, keywords: f.keywords.map(fold) }));

/** First function whose keywords appear in the title (list order = priority). */
export function classifyFunction(title: string): FunctionId | undefined {
  const t = fold(title);
  return FUNCTION_INDEX.find((f) => f.keywords.some((k) => containsPhrase(t, k)))?.id;
}
