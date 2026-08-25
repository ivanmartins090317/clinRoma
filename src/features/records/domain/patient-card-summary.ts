import { evaluateAnamnesisExpiry } from "@/features/records/domain/anamnesis-expiry";

export const EVOLUTION_EXCERPT_MAX = 120;
export const RELEVANT_YES_CAP = 5;

export const PATIENT_CARD_COPY = {
  anamnesisTitle: "Anamnese",
  lastProcedureTitle: "Último procedimento",
  staleAlert: "Anamnese desatualizada (mais de 12 meses).",
  missingAnamnesis: "Nenhuma anamnese registrada.",
  missingProcedure: "Nenhum procedimento registrado.",
  allergies: "Alergias",
  medications: "Medicamentos",
  diseases: "Doenças",
  relevantYes: "Atenção",
  openAnamnesis: "Abrir anamnese",
  openEvolutions: "Abrir evoluções",
  medicationInUse: "Em uso",
  hasAllergy: "Tem alergia",
} as const;

export const PAPER_DISEASE_LABELS: Record<string, string> = {
  disease_anemia: "Anemia",
  disease_ulcer: "Úlcera",
  disease_syphilis: "Sífilis",
  disease_heart: "Problemas Cardíacos",
  disease_hepatitis: "Hepatite",
  disease_tuberculosis: "Tuberculose",
  disease_chagas: "Doença de Chagas",
  disease_asthma: "Asma",
  disease_diabetes: "Diabetes",
  disease_rheumatic_fever: "Febre Reumática",
  disease_hemophilia: "Hemofilia",
  disease_liver: "Problemas Hepáticos",
  disease_nephritis: "Nefrite",
  disease_epilepsy: "Epilepsia",
  disease_hypertension: "Hipertensão",
  disease_sinusitis: "Sinusite",
};

export const PAPER_RELEVANT_YES_ORDER = [
  ["pregnant", "Está grávida?"],
  ["has_allergy", "Tem alguma alergia?"],
  ["drug_reaction", "Já apresentou alguma reação a algum medicamento?"],
  ["high_blood_pressure", "A pressão é alta?"],
  [
    "taking_medication",
    "Mesmo não estando em tratamento, está tomando algum medicamento?",
  ],
  ["bleeding_prior_surgery", "Apresentou hemorragia em cirurgias anteriores?"],
  ["bleeds_much_when_cut", "Perde muito sangue ao cortar-se?"],
  ["under_medical_care", "Está ou esteve recentemente sob cuidados médicos?"],
  ["hospitalized_or_surgery", "Já foi hospitalizado? Sofreu cirurgia?"],
  ["bronchial_asthma", "Sofre de asma brônquica?"],
  ["faint_or_seizure", "Já teve algum desmaio ou convulsão?"],
  ["nervous_sedatives", "Considera-se nervoso? Já tomou sedativos?"],
] as const;

export interface PaperAnswer {
  answer: "yes" | "no" | null;
  complement?: string | null;
}

export interface FreeTextAnamnesisSource {
  format: "free_text";
  signedAt: string | null;
  createdAt: string;
  allergies?: string | null;
  medications?: string | null;
  diseases?: string | null;
}

export interface PaperAnamnesisSource {
  format: "paper";
  signedAt: string | null;
  createdAt: string;
  diseases: string[];
  answers: Partial<Record<string, PaperAnswer>>;
}

export type AnamnesisCardSource =
  FreeTextAnamnesisSource | PaperAnamnesisSource;

export interface AnamnesisCardLine {
  label: string;
  value: string;
}

export interface AnamnesisCardView {
  dateLabel: string | null;
  isStale: boolean;
  isMissing: boolean;
  lines: AnamnesisCardLine[];
  relevantYes: string[];
}

export interface CompletedAppointmentInput {
  id: string;
  startsAt: string;
  procedureName: string | null;
}

export interface EvolutionCardInput {
  id: string;
  text: string;
  createdAt: string;
  appointmentId: string | null;
}

export interface LastProcedureCardView {
  kind: "procedure" | "evolution" | "empty";
  dateLabel: string | null;
  text: string;
  evolutionId: string | null;
}

export interface PatientCardSummary {
  anamnesis: AnamnesisCardView;
  lastProcedure: LastProcedureCardView;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCardDate(value: string): string | null {
  const date = parseDate(value);
  if (!date) return null;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function excerptEvolution(text: string): string | null {
  const trimmed = trimText(text);
  if (!trimmed) return null;
  if (trimmed.length <= EVOLUTION_EXCERPT_MAX) return trimmed;
  return `${trimmed.slice(0, EVOLUTION_EXCERPT_MAX - 3)}...`;
}

export function pickVigenteAnamnesis<
  T extends { signedAt: string | null; createdAt: string },
>(versions: T[]): T | null {
  if (versions.length === 0) return null;

  const signed = versions.filter((version) => parseDate(version.signedAt));
  const pool = signed.length > 0 ? signed : versions;
  const useSign = signed.length > 0;

  return (
    [...pool].sort((left, right) => {
      const leftDate = parseDate(useSign ? left.signedAt : left.createdAt);
      const rightDate = parseDate(useSign ? right.signedAt : right.createdAt);
      return (rightDate?.getTime() ?? 0) - (leftDate?.getTime() ?? 0);
    })[0] ?? null
  );
}

function pushLine(
  lines: AnamnesisCardLine[],
  label: string,
  value?: string | null,
) {
  const trimmed = trimText(value);
  if (trimmed) lines.push({ label, value: trimmed });
}

function isYes(answer: PaperAnswer | undefined): boolean {
  return answer?.answer === "yes";
}

function yesValue(
  answer: PaperAnswer | undefined,
  fallback: string,
): string | null {
  if (!isYes(answer)) return null;
  return trimText(answer?.complement) || fallback;
}

function freeTextLines(source: FreeTextAnamnesisSource): AnamnesisCardLine[] {
  const lines: AnamnesisCardLine[] = [];
  pushLine(lines, PATIENT_CARD_COPY.allergies, source.allergies);
  pushLine(lines, PATIENT_CARD_COPY.medications, source.medications);
  pushLine(lines, PATIENT_CARD_COPY.diseases, source.diseases);
  return lines;
}

function paperLines(source: PaperAnamnesisSource): AnamnesisCardLine[] {
  const lines: AnamnesisCardLine[] = [];
  const names = source.diseases
    .map((id) => PAPER_DISEASE_LABELS[id])
    .filter((label): label is string => Boolean(label));
  pushLine(lines, PATIENT_CARD_COPY.diseases, names.join(", "));
  pushLine(
    lines,
    PATIENT_CARD_COPY.medications,
    yesValue(
      source.answers.taking_medication,
      PATIENT_CARD_COPY.medicationInUse,
    ),
  );
  pushLine(
    lines,
    PATIENT_CARD_COPY.allergies,
    yesValue(source.answers.has_allergy, PATIENT_CARD_COPY.hasAllergy),
  );
  return lines;
}

function paperRelevantYes(source: PaperAnamnesisSource): string[] {
  const items: string[] = [];

  for (const [id, label] of PAPER_RELEVANT_YES_ORDER) {
    const answer = source.answers[id];
    if (!isYes(answer)) continue;
    const complement = trimText(answer?.complement);
    items.push(complement ? `${label}: ${complement}` : label);
    if (items.length === RELEVANT_YES_CAP) break;
  }

  return items;
}

export function buildAnamnesisCardView(
  vigente: AnamnesisCardSource | null,
  referenceDate?: Date,
): AnamnesisCardView {
  if (!vigente) {
    return {
      dateLabel: null,
      isStale: true,
      isMissing: true,
      lines: [],
      relevantYes: [],
    };
  }

  const expiry = evaluateAnamnesisExpiry({
    signedAt: vigente.signedAt,
    referenceDate,
  });
  if (expiry.isMissing) {
    return {
      dateLabel: null,
      isStale: true,
      isMissing: true,
      lines: [],
      relevantYes: [],
    };
  }

  return {
    dateLabel: vigente.signedAt ? formatCardDate(vigente.signedAt) : null,
    isStale: expiry.isExpired,
    isMissing: false,
    lines:
      vigente.format === "paper" ? paperLines(vigente) : freeTextLines(vigente),
    relevantYes: vigente.format === "paper" ? paperRelevantYes(vigente) : [],
  };
}

export function resolveLastProcedure(
  completedAppointment: CompletedAppointmentInput | null,
  evolutions: EvolutionCardInput[],
): LastProcedureCardView {
  const procedureName = trimText(completedAppointment?.procedureName);

  if (completedAppointment && procedureName) {
    return {
      kind: "procedure",
      dateLabel: formatCardDate(completedAppointment.startsAt),
      text: procedureName,
      evolutionId: null,
    };
  }

  const withText = evolutions.filter((item) => trimText(item.text));
  const linkedId = completedAppointment?.id ?? null;
  const byDate = (left: EvolutionCardInput, right: EvolutionCardInput) =>
    (parseDate(right.createdAt)?.getTime() ?? 0) -
    (parseDate(left.createdAt)?.getTime() ?? 0);
  const linked = linkedId
    ? withText.filter((item) => item.appointmentId === linkedId).sort(byDate)[0]
    : undefined;
  const chosen = linked ?? withText.slice().sort(byDate)[0];

  if (!chosen) {
    return {
      kind: "empty",
      dateLabel: null,
      text: PATIENT_CARD_COPY.missingProcedure,
      evolutionId: null,
    };
  }

  return {
    kind: "evolution",
    dateLabel: formatCardDate(chosen.createdAt),
    text: excerptEvolution(chosen.text) ?? PATIENT_CARD_COPY.missingProcedure,
    evolutionId: chosen.id,
  };
}

function parsePaperAnswer(value: unknown): PaperAnswer | null {
  if (typeof value === "string") {
    if (value === "yes" || value === "sim") return { answer: "yes" };
    if (value === "no" || value === "nao") return { answer: "no" };
    return null;
  }
  if (!isRecord(value)) return null;

  const raw = value.answer;
  const answer =
    raw === "yes" || raw === "sim"
      ? "yes"
      : raw === "no" || raw === "nao"
        ? "no"
        : null;
  if (!answer) return null;

  return {
    answer,
    complement: typeof value.complement === "string" ? value.complement : null,
  };
}

export function parseAnamnesisCardSource(
  content: unknown,
  createdAt: string,
): AnamnesisCardSource {
  const record = isRecord(content) ? content : {};
  const signedAt = typeof record.signedAt === "string" ? record.signedAt : null;

  if (record.formVersion === 2) {
    const diseases = Array.isArray(record.diseases)
      ? record.diseases.filter((id): id is string => typeof id === "string")
      : Object.keys(PAPER_DISEASE_LABELS).filter((id) => record[id] === true);
    const source = isRecord(record.answers) ? record.answers : record;
    const answers: PaperAnamnesisSource["answers"] = {};

    for (const [id] of PAPER_RELEVANT_YES_ORDER) {
      const parsed = parsePaperAnswer(source[id]);
      if (parsed) answers[id] = parsed;
    }

    return { format: "paper", signedAt, createdAt, diseases, answers };
  }

  return {
    format: "free_text",
    signedAt,
    createdAt,
    allergies: typeof record.allergies === "string" ? record.allergies : null,
    medications:
      typeof record.medications === "string" ? record.medications : null,
    diseases:
      typeof record.systemicConditions === "string"
        ? record.systemicConditions
        : null,
  };
}

export function emptyPatientCardSummary(): PatientCardSummary {
  return {
    anamnesis: buildAnamnesisCardView(null),
    lastProcedure: resolveLastProcedure(null, []),
  };
}
