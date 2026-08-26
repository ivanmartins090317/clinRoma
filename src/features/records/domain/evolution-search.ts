export const EVOLUTION_SEARCH_TERM_MAX = 80;

export const EVOLUTION_SEARCH_COPY = {
  label: "Buscar no histórico",
  placeholder: "Digite o texto da evolução e transcrição.",
  empty: "Nenhuma evolução encontrada para esta busca.",
  clear: "Limpar busca",
} as const;

export interface EvolutionSearchAttachment {
  attachmentType: string;
  transcriptionStatus: string;
  transcription: string | null;
}

export interface EvolutionSearchRecord {
  id: string;
  text: string;
  attachments: EvolutionSearchAttachment[];
}

export function normalizeSearchTerm(raw: string): string {
  return raw.trim();
}

function containsExactSubstring(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function completedTranscriptionText(
  attachment: EvolutionSearchAttachment,
): string | null {
  if (attachment.attachmentType !== "audio") {
    return null;
  }

  if (attachment.transcriptionStatus !== "completed") {
    return null;
  }

  const text = (attachment.transcription ?? "").trim();
  return text.length > 0 ? text : null;
}

export function evolutionMatchesTerm(
  evolution: EvolutionSearchRecord,
  term: string,
): boolean {
  const needle = normalizeSearchTerm(term);

  if (needle.length === 0) {
    return true;
  }

  if (containsExactSubstring(evolution.text.trim(), needle)) {
    return true;
  }

  return evolution.attachments.some((attachment) => {
    const transcription = completedTranscriptionText(attachment);
    return transcription
      ? containsExactSubstring(transcription, needle)
      : false;
  });
}

export function filterEvolutionsByTerm<T extends EvolutionSearchRecord>(
  evolutions: T[],
  term: string,
): T[] {
  const needle = normalizeSearchTerm(term);

  if (needle.length === 0) {
    return evolutions;
  }

  return evolutions.filter((evolution) =>
    evolutionMatchesTerm(evolution, needle),
  );
}
