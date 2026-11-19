/**
 * Turkish-aware text folding, used before every comparison.
 * 1. Locale-correct lower-casing (İ → i, I → ı), so "IĞDIR" and "Iğdır" agree.
 * 2. Fold Turkish letters to ASCII (ı/i, ş/s, ğ/g, ç/c, ö/o, ü/u) and strip other accents.
 * 3. Collapse punctuation to single spaces.
 */
export function fold(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Legal-form suffixes removed from company names before comparing them. */
const LEGAL_SUFFIXES = [
  'anonim sirketi', 'limited sirketi', 'ltd sti', 'ltd', 'sti', 'as', 'a s', 'san ve tic', 'san tic',
  'sanayi ve ticaret', 'sanayi', 'ticaret', 'tic', 'san', 'inc', 'llc', 'gmbh', 'bv', 'b v', 'co',
  'corp', 'limited', 'plc', 'sa', 'srl', 'ag',
];

export function normalizeCompany(name: string): string {
  let n = ` ${fold(name)} `;
  // Remove suffixes repeatedly, longest first, wherever they stand as whole words.
  const sorted = [...LEGAL_SUFFIXES].sort((a, b) => b.length - a.length);
  let changed = true;
  while (changed) {
    changed = false;
    for (const sfx of sorted) {
      const re = new RegExp(` ${sfx} `, 'g');
      if (re.test(n)) {
        n = n.replace(re, ' ');
        changed = true;
      }
    }
  }
  return n.replace(/\s+/g, ' ').trim();
}

/** Whole-phrase match on folded text: "sef" matches "sous sef" but not "sefkat". */
export function containsPhrase(haystackFolded: string, phraseFolded: string): boolean {
  if (!phraseFolded) return false;
  return ` ${haystackFolded} `.includes(` ${phraseFolded} `);
}

/** Strip HTML tags and entities, then cut to a short snippet (no full copies of third-party text). */
export function snippet(html: string | undefined, max = 240): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
