export const ANAMNESIS_FORM_VERSION_V2 = 2;

export type YesNoAnswer = "yes" | "no";
export type AnamnesisInvitePurpose = "pre_consult" | "office";
export type AnamnesisOrigin = "chart" | "invite";

export interface YesNoQuestion {
  id: string;
  text: string;
  complementLabel?: string;
}

export interface PaperBlock {
  id: string;
  title: string;
  questions: YesNoQuestion[];
  includeDiseases?: boolean;
}

export interface PaperDisease {
  id: string;
  label: string;
}

export interface PaperAnswerDraft {
  answer: YesNoAnswer | null;
  complement: string;
}

export interface PaperAnswerPersisted {
  answer: YesNoAnswer;
  complement?: string;
}

export interface AnamnesisContentV2 {
  formVersion: typeof ANAMNESIS_FORM_VERSION_V2;
  signedAt: string;
  signatureName: string;
  signatureConfirmed: true;
  declarationText: string;
  answers: Record<string, PaperAnswerPersisted>;
  diseases: string[];
  otherDisease?: string;
  origin: AnamnesisOrigin;
  invitePurpose?: AnamnesisInvitePurpose;
}

export const ANAMNESIS_DECLARATION_TEXT =
  "Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.";

export const ANAMNESIS_COPY = {
  publicTitle: "QUESTIONÁRIO PARA O PACIENTE",
  generatePreConsult: "Gerar link pré-consulta",
  openTablet: "Abrir no tablet",
  sendWhatsApp: "Enviar questionário por WhatsApp",
  helpPreConsult:
    "Envie pelo WhatsApp da clínica ou copie o link. Vale por 7 dias.",
  helpTablet:
    "Abra este link no tablet da clínica. Vale até o fim de hoje. Não entre com a conta da equipe nesse aparelho.",
  linkReplaced: "O link anterior desta finalidade não vale mais.",
  publicConsent:
    "Li e concordo com o tratamento dos meus dados de saúde neste questionário pela clínica.",
  submit: "Enviar questionário",
  successChart: "Nova versão de anamnese salva.",
  successInvite: "Questionário enviado. Obrigado.",
  genericInvite: "Link inválido ou expirado.",
  missingYesNo: "Responda Sim ou Não em todas as perguntas.",
  missingComplement: "Informe o complemento desta resposta.",
  missingDeclaration: "Confirme a declaração e informe o nome.",
  missingConsent: "Confirme o consentimento para enviar.",
  forbiddenInvite: "Sem permissão para gerar o link de anamnese.",
  diseasesHeading: "Já foi acometido de alguma dessas doenças?",
  otherDiseaseLabel:
    "Você tem alguma outra doença, condição ou problema não citado acima?",
  womenHeading: "Apenas para mulheres",
  dentistName: "Dr. Fellipe S. Roma",
  dentistRole: "Cirurgião-Dentista",
  dentistSpecialty:
    "Especialista em Cirurgia e Traumatologia Buco-Maxilo-Facial",
} as const;

export const PAPER_DISEASES: PaperDisease[] = [
  { id: "disease_anemia", label: "Anemia" },
  { id: "disease_ulcer", label: "Úlcera" },
  { id: "disease_syphilis", label: "Sífilis" },
  { id: "disease_heart", label: "Problemas Cardíacos" },
  { id: "disease_hepatitis", label: "Hepatite" },
  { id: "disease_tuberculosis", label: "Tuberculose" },
  { id: "disease_chagas", label: "Doença de Chagas" },
  { id: "disease_asthma", label: "Asma" },
  { id: "disease_diabetes", label: "Diabetes" },
  { id: "disease_rheumatic_fever", label: "Febre Reumática" },
  { id: "disease_hemophilia", label: "Hemofilia" },
  { id: "disease_liver", label: "Problemas Hepáticos" },
  { id: "disease_nephritis", label: "Nefrite" },
  { id: "disease_epilepsy", label: "Epilepsia" },
  { id: "disease_hypertension", label: "Hipertensão" },
  { id: "disease_sinusitis", label: "Sinusite" },
];

export const PAPER_DISEASE_IDS = PAPER_DISEASES.map((item) => item.id);

export const PAPER_BLOCKS: PaperBlock[] = [
  {
    id: "general_health",
    title: "Saúde geral",
    includeDiseases: true,
    questions: [
      {
        id: "health_ok",
        text: "Está bem de saúde atualmente?",
        complementLabel: "Por quê?",
      },
      {
        id: "under_medical_care",
        text: "Está ou esteve recentemente sob cuidados médicos?",
        complementLabel: "Por quê?",
      },
      {
        id: "taking_medication",
        text: "Mesmo não estando em tratamento, está tomando algum medicamento?",
        complementLabel: "Qual(is)?",
      },
    ],
  },
  {
    id: "bleeding",
    title: "Sangramento",
    questions: [
      {
        id: "bleeding_prior_surgery",
        text: "Apresentou hemorragia em cirurgias anteriores?",
      },
      { id: "bleeds_much_when_cut", text: "Perde muito sangue ao cortar-se?" },
      {
        id: "bleeding_lasts_long",
        text: "Continua por muito tempo o sangramento?",
      },
      {
        id: "bruises_easily",
        text: "Tem facilmente hematomas em contusões?",
      },
    ],
  },
  {
    id: "cardio_respiratory",
    title: "Respiratório e cardiovascular",
    questions: [
      { id: "shortness_of_breath", text: "Sente falta de ar?" },
      {
        id: "tired_climbing_stairs",
        text: "Normalmente sente muito cansaço ao subir escada?",
      },
      { id: "ankle_swelling", text: "Apresenta inchaço nos tornozelos?" },
      {
        id: "chest_back_pain",
        text: "Apresenta dores no peito ou costas (Palpitações)?",
      },
      {
        id: "headache_nausea",
        text: "Tem cefaléias frequentes ou náuseas?",
      },
    ],
  },
  {
    id: "family_habits",
    title: "Família, hábitos e cicatrização",
    questions: [
      { id: "family_diabetes", text: "Tem algum diabético em sua família?" },
      { id: "urinates_often", text: "Urina com muita frequência?" },
      { id: "drinks_lots_of_liquid", text: "Ingere muito líquido?" },
      { id: "eats_lots_of_sweets", text: "Come muito doce?" },
      {
        id: "slow_wound_healing",
        text: "Sua cicatriz de ferimento é demorada?",
      },
    ],
  },
  {
    id: "allergy_history",
    title: "Nervosismo, alergia e histórico",
    questions: [
      {
        id: "nervous_sedatives",
        text: "Considera-se nervoso? Já tomou sedativos?",
      },
      {
        id: "depression_medication",
        text: "Toma medicamento para depressão?",
      },
      { id: "took_penicillin", text: "Já tomou penicilina?" },
      { id: "bronchial_asthma", text: "Sofre de asma brônquica?" },
      {
        id: "prior_dental_anesthesia",
        text: "Já foi anestesiado em dentista anteriormente? Passa mal?",
      },
      {
        id: "has_allergy",
        text: "Tem alguma alergia?",
        complementLabel: "Qual(is)?",
      },
      {
        id: "drug_reaction",
        text: "Já apresentou alguma reação a algum medicamento?",
        complementLabel: "Se sim, qual(is)?",
      },
      { id: "high_blood_pressure", text: "A pressão é alta?" },
      { id: "epileptic_relative", text: "Algum parente epilético?" },
      {
        id: "faint_or_seizure",
        text: "Já teve algum desmaio ou convulsão?",
      },
      {
        id: "blood_transfusion",
        text: "Já recebeu transfusão de sangue?",
      },
      {
        id: "hospitalized_or_surgery",
        text: "Já foi hospitalizado? Sofreu cirurgia?",
      },
      {
        id: "dental_treatment_complication",
        text: "Alguma complicação durante tratamento odontológico?",
      },
      {
        id: "drinks_alcohol_habitually",
        text: "Toma habitualmente bebidas alcoólicas?",
      },
    ],
  },
  {
    id: "women",
    title: ANAMNESIS_COPY.womenHeading,
    questions: [
      { id: "menopause", text: "Já entrou na menopausa?" },
      {
        id: "osteoporosis_or_family",
        text: "Tem osteoporose ou alguém da família teve?",
      },
      { id: "pregnant", text: "Está grávida?" },
    ],
  },
];

export function listYesNoQuestions(): YesNoQuestion[] {
  return PAPER_BLOCKS.flatMap((block) => block.questions);
}

export function findYesNoQuestion(id: string): YesNoQuestion | undefined {
  return listYesNoQuestions().find((question) => question.id === id);
}

export function applyExclusiveYesNo(
  draft: PaperAnswerDraft | undefined,
  answer: YesNoAnswer,
): PaperAnswerDraft {
  return {
    answer,
    complement: answer === "yes" ? (draft?.complement ?? "") : "",
  };
}

export function persistPaperAnswers(
  drafts: Record<string, PaperAnswerDraft>,
): Record<string, PaperAnswerPersisted> | null {
  const persisted: Record<string, PaperAnswerPersisted> = {};

  for (const question of listYesNoQuestions()) {
    const draft = drafts[question.id];
    if (draft?.answer !== "yes" && draft?.answer !== "no") return null;

    const complement = draft.complement.trim();
    if (draft.answer === "yes" && question.complementLabel && !complement) {
      return null;
    }

    persisted[question.id] =
      draft.answer === "yes" && question.complementLabel
        ? { answer: "yes", complement }
        : { answer: draft.answer };
  }

  return persisted;
}

export interface ValidatePaperInput {
  answers: Record<string, PaperAnswerDraft>;
  diseases: string[];
  otherDisease?: string;
  signatureConfirmed: boolean;
  signatureName: string;
  requireConsent?: boolean;
  consentConfirmed?: boolean;
}

export function validatePaperSubmission(
  input: ValidatePaperInput,
): string | null {
  if (input.requireConsent && !input.consentConfirmed) {
    return ANAMNESIS_COPY.missingConsent;
  }

  for (const question of listYesNoQuestions()) {
    const answer = input.answers[question.id]?.answer;
    if (answer !== "yes" && answer !== "no") {
      return ANAMNESIS_COPY.missingYesNo;
    }

    if (
      answer === "yes" &&
      question.complementLabel &&
      !input.answers[question.id]?.complement.trim()
    ) {
      return ANAMNESIS_COPY.missingComplement;
    }
  }

  const name = input.signatureName.trim();
  if (!input.signatureConfirmed || name.length < 2) {
    return ANAMNESIS_COPY.missingDeclaration;
  }

  return null;
}

export function sanitizeDiseases(ids: string[]): string[] {
  const allowed = new Set(PAPER_DISEASE_IDS);
  return [...new Set(ids.filter((id) => allowed.has(id)))];
}

export function sanitizeOtherDisease(
  value: string | undefined,
): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildAnamnesisContentV2(input: {
  answers: Record<string, PaperAnswerDraft>;
  diseases: string[];
  otherDisease?: string;
  signatureName: string;
  origin: AnamnesisOrigin;
  invitePurpose?: AnamnesisInvitePurpose;
  signedAt?: string;
}): AnamnesisContentV2 | null {
  const answers = persistPaperAnswers(input.answers);
  if (!answers) return null;

  const content: AnamnesisContentV2 = {
    formVersion: ANAMNESIS_FORM_VERSION_V2,
    signedAt: input.signedAt ?? new Date().toISOString(),
    signatureName: input.signatureName.trim(),
    signatureConfirmed: true,
    declarationText: ANAMNESIS_DECLARATION_TEXT,
    answers,
    diseases: sanitizeDiseases(input.diseases),
    origin: input.origin,
  };

  const otherDisease = sanitizeOtherDisease(input.otherDisease);
  if (otherDisease) content.otherDisease = otherDisease;
  if (input.origin === "invite" && input.invitePurpose) {
    content.invitePurpose = input.invitePurpose;
  }

  return content;
}

export function buildAnamnesisPreviewV2(content: AnamnesisContentV2): string {
  const labels = content.diseases
    .map((id) => PAPER_DISEASES.find((item) => item.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(", ") : "Nenhuma doença marcada";
}

export function isAnamnesisContentV2(
  content: unknown,
): content is AnamnesisContentV2 {
  return (
    typeof content === "object" &&
    content !== null &&
    (content as { formVersion?: unknown }).formVersion ===
      ANAMNESIS_FORM_VERSION_V2
  );
}

export function formatVigenteDateLabel(signedAt: string): string {
  const date = new Date(signedAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function vigenteInviteNotice(signedAt: string): string {
  const label = formatVigenteDateLabel(signedAt);
  return `Você já preencheu em ${label}. Pode enviar uma nova versão.`;
}
