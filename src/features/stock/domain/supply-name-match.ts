export interface SupplyNameCandidate {
  id: string;
  name: string;
}

export interface SupplyNameMatchResult {
  confidence: "high" | "low";
  mode: "existing" | "new";
  supplyId: string | null;
}

/** Confiança alta exige semelhança forte e distância clara do 2º colocado. */
const HIGH_SIMILARITY = 0.85;
const CLEAR_LEAD = 0.1;

export function normalizeSupplyName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  const current = new Array<number>(right.length + 1);

  for (let i = 0; i < left.length; i += 1) {
    current[0] = i + 1;
    for (let j = 0; j < right.length; j += 1) {
      const cost = left[i] === right[j] ? 0 : 1;
      current[j + 1] = Math.min(
        previous[j + 1] + 1,
        current[j] + 1,
        previous[j] + cost,
      );
    }
    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j] ?? 0;
    }
  }

  return previous[right.length] ?? right.length;
}

export function supplyNameSimilarity(left: string, right: string): number {
  const a = normalizeSupplyName(left);
  const b = normalizeSupplyName(right);

  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Aproxima o nome lido ao catálogo.
 * Empate ou semelhança fraca nunca escolhe sozinho (confiança baixa = novo).
 */
export function matchSupplyName(
  rawName: string,
  candidates: SupplyNameCandidate[],
): SupplyNameMatchResult {
  const normalized = normalizeSupplyName(rawName);

  if (!normalized || candidates.length === 0) {
    return { confidence: "low", mode: "new", supplyId: null };
  }

  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: supplyNameSimilarity(normalized, candidate.name),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];

  if (!best || best.score <= 0) {
    return { confidence: "low", mode: "new", supplyId: null };
  }

  if (best.score === 1) {
    return {
      confidence: "high",
      mode: "existing",
      supplyId: best.candidate.id,
    };
  }

  const hasClearLead =
    !second ||
    best.score - second.score >= CLEAR_LEAD ||
    second.score < HIGH_SIMILARITY;

  if (best.score >= HIGH_SIMILARITY && hasClearLead) {
    return {
      confidence: "high",
      mode: "existing",
      supplyId: best.candidate.id,
    };
  }

  return { confidence: "low", mode: "new", supplyId: null };
}
