export interface UsefSectionCode {
  code: string;
  divisionName: string;
  sectionName: string;
  sortOrder: number;
}

const ORDINALS: Record<string, string> = {
  '1st': 'first',
  '2nd': 'second',
  '3rd': 'third',
  '4th': 'fourth',
};
const STOPWORDS = new Set(['test', 'tests', 'class', 'classes', 'of', 'the', 'and']);
const FREE_SECTION_TOKENS = new Set(['dressage']);
const LEVEL_TOKEN_WEIGHT = 0.25;
const LEVEL_UNMATCHED_PENALTY = 0.1;
const UNMATCHED_PENALTY = 0.35;
const MIN_PREFIX_LENGTH = 4;

function stem(token: string): string {
  return token.length > 3 && token.endsWith('s') && !token.endsWith('ss') && !token.endsWith('us')
    ? token.slice(0, -1)
    : token;
}

function tokenize(text: string, isClassLabel: boolean): string[] {
  const tokens: string[] = [];
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw || STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
    if (isClassLabel && raw.length === 1) continue;
    tokens.push(stem(ORDINALS[raw] ?? raw));
  }
  return tokens;
}

function tokensMatch(labelToken: string, sectionToken: string): boolean {
  return (
    labelToken === sectionToken ||
    (labelToken.length >= MIN_PREFIX_LENGTH && sectionToken.startsWith(labelToken))
  );
}

function dressageRank(divisionName: string): number {
  const division = divisionName.trim().toLowerCase();
  if (division === 'dressage') return 0;
  return division.includes('dressage') ? 1 : 2;
}

const round = (n: number) => Math.round(n * 1e6);

export function suggestSectionCodes(
  classLabel: string,
  codes: readonly UsefSectionCode[],
  limit = 5,
): UsefSectionCode[] {
  const labelTokens = tokenize(classLabel, true);
  if (labelTokens.every((t) => t === 'level')) return [];

  const ranked: { code: UsefSectionCode; score: number; rank: number }[] = [];
  for (const code of codes) {
    const sectionTokens = tokenize(code.sectionName, false);

    let score = 0;
    let matchedSubstantive = false;
    for (const label of labelTokens) {
      if (!sectionTokens.some((s) => tokensMatch(label, s))) continue;
      if (label === 'level') {
        score += LEVEL_TOKEN_WEIGHT;
      } else {
        score += 1;
        matchedSubstantive = true;
      }
    }
    if (!matchedSubstantive) continue;

    for (const section of sectionTokens) {
      if (labelTokens.some((l) => tokensMatch(l, section)) || FREE_SECTION_TOKENS.has(section)) {
        continue;
      }
      score -= section === 'level' ? LEVEL_UNMATCHED_PENALTY : UNMATCHED_PENALTY;
    }

    ranked.push({ code, score: round(score), rank: dressageRank(code.divisionName) });
  }

  ranked.sort(
    (a, b) => b.score - a.score || a.rank - b.rank || a.code.sortOrder - b.code.sortOrder,
  );
  return ranked.slice(0, limit).map((r) => r.code);
}
