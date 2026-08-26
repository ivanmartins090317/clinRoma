import { describe, expect, it } from "vitest";

import { parseAnamnesisCardSource } from "@/features/records/domain/patient-card-summary";
import {
  ANAMNESIS_COPY,
  ANAMNESIS_DECLARATION_TEXT,
  ANAMNESIS_FORM_VERSION_V2,
  PAPER_BLOCKS,
  PAPER_DISEASES,
  applyExclusiveYesNo,
  buildAnamnesisContentV2,
  buildAnamnesisPreviewV2,
  findYesNoQuestion,
  listYesNoQuestions,
  persistPaperAnswers,
  sanitizeOtherDisease,
  validatePaperSubmission,
  type PaperAnswerDraft,
} from "@/features/records/domain/anamnesis-form-v2";

function allNo(
  overrides: Record<string, PaperAnswerDraft> = {},
): Record<string, PaperAnswerDraft> {
  const answers: Record<string, PaperAnswerDraft> = {};

  for (const question of listYesNoQuestions()) {
    answers[question.id] = { answer: "no", complement: "" };
  }

  return { ...answers, ...overrides };
}

function validInput(
  overrides: Partial<{
    answers: Record<string, PaperAnswerDraft>;
    diseases: string[];
    otherDisease: string;
    signatureConfirmed: boolean;
    signatureName: string;
    requireConsent: boolean;
    consentConfirmed: boolean;
  }> = {},
) {
  return {
    answers: allNo(),
    diseases: [] as string[],
    signatureConfirmed: true,
    signatureName: "Maria Silva",
    ...overrides,
  };
}

describe("anamnesis-form-v2", () => {
  it("cobre o apêndice: complemento, doenças, mulheres e declaração", () => {
    expect(findYesNoQuestion("taking_medication")?.complementLabel).toBe(
      "Qual(is)?",
    );
    expect(findYesNoQuestion("has_allergy")?.text).toBe("Tem alguma alergia?");
    expect(PAPER_DISEASES.map((item) => item.id)).toContain(
      "disease_sinusitis",
    );
    expect(PAPER_BLOCKS.at(-1)?.id).toBe("women");
    expect(findYesNoQuestion("pregnant")?.text).toBe("Está grávida?");
    expect(ANAMNESIS_DECLARATION_TEXT).toBe(
      "Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.",
    );
    expect(listYesNoQuestions()).toHaveLength(34);
  });

  it("Sim e Não são exclusivos e o complemento some no Não", () => {
    const yes = applyExclusiveYesNo(
      { answer: null, complement: "Losartana" },
      "yes",
    );
    expect(yes).toEqual({ answer: "yes", complement: "Losartana" });

    const no = applyExclusiveYesNo(yes, "no");
    expect(no).toEqual({ answer: "no", complement: "" });
  });

  it("exige Sim ou Não em todas as perguntas", () => {
    const answers = allNo();
    answers.health_ok = { answer: null, complement: "" };

    expect(validatePaperSubmission(validInput({ answers }))).toBe(
      ANAMNESIS_COPY.missingYesNo,
    );
  });

  it("exige complemento quando a resposta é Sim", () => {
    const answers = allNo({
      has_allergy: { answer: "yes", complement: "  " },
    });

    expect(validatePaperSubmission(validInput({ answers }))).toBe(
      ANAMNESIS_COPY.missingComplement,
    );

    answers.has_allergy = { answer: "yes", complement: "Dipirona" };
    expect(validatePaperSubmission(validInput({ answers }))).toBeNull();
  });

  it("não grava complemento ao persistir Não", () => {
    const persisted = persistPaperAnswers(
      allNo({
        taking_medication: { answer: "no", complement: "Losartana" },
      }),
    );

    expect(persisted?.taking_medication).toEqual({ answer: "no" });
  });

  it("lista de doenças vazia é válida e várias marcas são aceitas", () => {
    expect(validatePaperSubmission(validInput({ diseases: [] }))).toBeNull();

    const content = buildAnamnesisContentV2({
      answers: allNo(),
      diseases: ["disease_sinusitis", "disease_anemia", "disease_unknown"],
      signatureName: "Maria Silva",
      origin: "chart",
    });

    expect(content?.diseases).toEqual(["disease_sinusitis", "disease_anemia"]);
    expect(buildAnamnesisPreviewV2(content!)).toBe("Sinusite, Anemia");
  });

  it("bloco para mulheres segue a regra Sim/Não obrigatória", () => {
    const answers = allNo();
    answers.pregnant = { answer: null, complement: "" };

    expect(validatePaperSubmission(validInput({ answers }))).toBe(
      ANAMNESIS_COPY.missingYesNo,
    );
  });

  it("declaração exige confirmação e nome com pelo menos 2 caracteres", () => {
    expect(
      validatePaperSubmission(validInput({ signatureConfirmed: false })),
    ).toBe(ANAMNESIS_COPY.missingDeclaration);
    expect(validatePaperSubmission(validInput({ signatureName: " A " }))).toBe(
      ANAMNESIS_COPY.missingDeclaration,
    );
  });

  it("consentimento só é exigido na superfície pública", () => {
    expect(
      validatePaperSubmission(
        validInput({ requireConsent: true, consentConfirmed: false }),
      ),
    ).toBe(ANAMNESIS_COPY.missingConsent);

    expect(validatePaperSubmission(validInput())).toBeNull();
  });

  it("texto de outra doença só com espaços não é gravado", () => {
    expect(sanitizeOtherDisease("   ")).toBeUndefined();

    const content = buildAnamnesisContentV2({
      answers: allNo({
        taking_medication: { answer: "yes", complement: "Losartana" },
        has_allergy: { answer: "yes", complement: "Dipirona" },
      }),
      diseases: ["disease_sinusitis"],
      otherDisease: "   ",
      signatureName: "Maria Silva",
      origin: "invite",
      invitePurpose: "pre_consult",
    });

    expect(content?.formVersion).toBe(ANAMNESIS_FORM_VERSION_V2);
    expect(content?.otherDisease).toBeUndefined();
    expect(content?.answers.taking_medication).toEqual({
      answer: "yes",
      complement: "Losartana",
    });
  });

  it("grava ids que o recorte do card já lê", () => {
    const content = buildAnamnesisContentV2({
      answers: allNo({
        taking_medication: { answer: "yes", complement: "Losartana" },
        has_allergy: { answer: "yes", complement: "Dipirona" },
        pregnant: { answer: "yes", complement: "" },
      }),
      diseases: ["disease_sinusitis"],
      signatureName: "Maria Silva",
      origin: "chart",
    });

    const source = parseAnamnesisCardSource(content, content!.signedAt);
    expect(source.format).toBe("paper");
    if (source.format !== "paper") return;

    expect(source.diseases).toEqual(["disease_sinusitis"]);
    expect(source.answers.taking_medication).toMatchObject({
      answer: "yes",
      complement: "Losartana",
    });
    expect(source.answers.has_allergy?.answer).toBe("yes");
    expect(source.answers.pregnant?.answer).toBe("yes");
  });
});
