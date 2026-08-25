import { describe, expect, it } from "vitest";

import {
  PATIENT_CARD_COPY,
  RELEVANT_YES_CAP,
  buildAnamnesisCardView,
  excerptEvolution,
  parseAnamnesisCardSource,
  pickVigenteAnamnesis,
  resolveLastProcedure,
  type AnamnesisCardSource,
  type EvolutionCardInput,
  type PaperAnamnesisSource,
} from "@/features/records/domain/patient-card-summary";

const signedRecent = "2026-07-01T12:00:00-03:00";
const createdRecent = "2026-07-01T12:05:00-03:00";
const referenceDate = new Date("2026-08-25T12:00:00-03:00");

function freeText(
  overrides: Partial<
    Extract<AnamnesisCardSource, { format: "free_text" }>
  > = {},
): AnamnesisCardSource {
  return {
    format: "free_text",
    signedAt: signedRecent,
    createdAt: createdRecent,
    allergies: "Dipirona",
    medications: "Losartana",
    diseases: "Hipertensão",
    ...overrides,
  };
}

function paper(
  overrides: Partial<PaperAnamnesisSource> = {},
): PaperAnamnesisSource {
  return {
    format: "paper",
    signedAt: signedRecent,
    createdAt: createdRecent,
    diseases: [],
    answers: {},
    ...overrides,
  };
}

function evolution(
  overrides: Partial<EvolutionCardInput> &
    Pick<EvolutionCardInput, "id" | "text">,
): EvolutionCardInput {
  return {
    createdAt: "2026-08-10T15:00:00-03:00",
    appointmentId: null,
    ...overrides,
  };
}

describe("buildAnamnesisCardView · texto livre", () => {
  it("mostra alergias, medicamentos e doenças preenchidos", () => {
    const view = buildAnamnesisCardView(freeText(), referenceDate);

    expect(view.isMissing).toBe(false);
    expect(view.isStale).toBe(false);
    expect(view.dateLabel).toBe("01/07/2026");
    expect(view.relevantYes).toEqual([]);
    expect(view.lines).toEqual([
      { label: "Alergias", value: "Dipirona" },
      { label: "Medicamentos", value: "Losartana" },
      { label: "Doenças", value: "Hipertensão" },
    ]);
  });

  it("omite campos vazios depois do trim", () => {
    const view = buildAnamnesisCardView(
      freeText({
        allergies: "  ",
        medications: "Losartana",
        diseases: undefined,
      }),
      referenceDate,
    );

    expect(view.lines).toEqual([{ label: "Medicamentos", value: "Losartana" }]);
  });

  it("mostra texto Nenhuma conhecida porque está preenchido", () => {
    const view = buildAnamnesisCardView(
      freeText({
        allergies: "Nenhuma conhecida",
        medications: "",
        diseases: "",
      }),
      referenceDate,
    );

    expect(view.lines).toEqual([
      { label: "Alergias", value: "Nenhuma conhecida" },
    ]);
  });

  it("ausente: vazio e alerta de desatualizada", () => {
    const view = buildAnamnesisCardView(null, referenceDate);

    expect(view.isMissing).toBe(true);
    expect(view.isStale).toBe(true);
    expect(view.lines).toEqual([]);
  });

  it("assinatura inválida trata como ausente", () => {
    const view = buildAnamnesisCardView(
      freeText({ signedAt: "data-invalida" }),
      referenceDate,
    );

    expect(view.isMissing).toBe(true);
    expect(view.isStale).toBe(true);
    expect(view.lines).toEqual([]);
  });

  it("reutiliza 12 meses: vigente expirada mostra recorte e alerta", () => {
    const view = buildAnamnesisCardView(
      freeText({ signedAt: "2024-08-01T12:00:00-03:00" }),
      referenceDate,
    );

    expect(view.isStale).toBe(true);
    expect(view.isMissing).toBe(false);
    expect(view.lines[0]).toEqual({ label: "Alergias", value: "Dipirona" });
  });
});

describe("buildAnamnesisCardView · questionário papel", () => {
  it("recorte de doenças marcadas, medicamentos e alergias Sim", () => {
    const view = buildAnamnesisCardView(
      paper({
        diseases: ["disease_diabetes", "disease_hypertension"],
        answers: {
          taking_medication: { answer: "yes", complement: "Losartana" },
          has_allergy: { answer: "yes", complement: "dipirona" },
        },
      }),
      referenceDate,
    );

    expect(view.lines).toEqual([
      { label: "Doenças", value: "Diabetes, Hipertensão" },
      { label: "Medicamentos", value: "Losartana" },
      { label: "Alergias", value: "dipirona" },
    ]);
  });

  it("omite linha quando Não; Sim sem complemento usa texto curto", () => {
    const view = buildAnamnesisCardView(
      paper({
        answers: {
          taking_medication: { answer: "yes" },
          has_allergy: { answer: "no", complement: "não deve aparecer" },
        },
      }),
      referenceDate,
    );

    expect(view.lines).toEqual([{ label: "Medicamentos", value: "Em uso" }]);
  });

  it("Sim relevantes na ordem fixa com teto de 5", () => {
    const view = buildAnamnesisCardView(
      paper({
        answers: {
          pregnant: { answer: "yes" },
          has_allergy: { answer: "yes", complement: "dipirona" },
          drug_reaction: { answer: "yes" },
          high_blood_pressure: { answer: "yes" },
          taking_medication: { answer: "yes", complement: "Losartana" },
          bleeding_prior_surgery: { answer: "yes" },
          bronchial_asthma: { answer: "no" },
        },
      }),
      referenceDate,
    );

    expect(view.relevantYes).toHaveLength(RELEVANT_YES_CAP);
    expect(view.relevantYes[0]).toBe("Está grávida?");
    expect(view.relevantYes[1]).toBe("Tem alguma alergia?: dipirona");
    expect(view.relevantYes.at(-1)).toContain("medicamento");
    expect(view.relevantYes.join(" ")).not.toContain("hemorragia");
  });

  it("omite o bloco Atenção quando não há Sim", () => {
    const view = buildAnamnesisCardView(
      paper({ answers: { has_allergy: { answer: "no" } } }),
      referenceDate,
    );

    expect(view.relevantYes).toEqual([]);
  });

  it("doença marcada e Sim de pressão alta não se deduplicam", () => {
    const view = buildAnamnesisCardView(
      paper({
        diseases: ["disease_hypertension"],
        answers: { high_blood_pressure: { answer: "yes" } },
      }),
      referenceDate,
    );

    expect(view.lines).toEqual([{ label: "Doenças", value: "Hipertensão" }]);
    expect(view.relevantYes).toEqual(["A pressão é alta?"]);
  });
});

describe("parseAnamnesisCardSource", () => {
  it("discrimina texto livre e papel pelo formVersion", () => {
    expect(
      parseAnamnesisCardSource(
        { formVersion: 1, allergies: "Látex" },
        createdRecent,
      ).format,
    ).toBe("free_text");
    expect(
      parseAnamnesisCardSource(
        {
          formVersion: 2,
          diseases: ["disease_asthma"],
          answers: { pregnant: { answer: "yes" } },
        },
        createdRecent,
      ).format,
    ).toBe("paper");
  });
});

describe("pickVigenteAnamnesis", () => {
  it("escolhe a assinatura mais recente; sem assinatura usa o registro", () => {
    const vigente = pickVigenteAnamnesis([
      {
        signedAt: "2025-01-01T12:00:00-03:00",
        createdAt: "2026-08-01T12:00:00-03:00",
        id: "old-sign",
      },
      {
        signedAt: "2026-06-01T12:00:00-03:00",
        createdAt: "2026-06-01T12:00:00-03:00",
        id: "new-sign",
      },
    ]);

    expect(vigente?.id).toBe("new-sign");
    expect(
      pickVigenteAnamnesis([
        { signedAt: null, createdAt: "2026-08-01T12:00:00-03:00", id: "newer" },
        {
          signedAt: "invalida",
          createdAt: "2026-01-01T12:00:00-03:00",
          id: "older",
        },
      ])?.id,
    ).toBe("newer");
  });
});

describe("resolveLastProcedure", () => {
  const completed = {
    id: "apt-1",
    startsAt: "2026-08-11T13:00:00.000Z",
    procedureName: "Restauração",
  };

  it("usa consulta concluída com nome", () => {
    const view = resolveLastProcedure(completed, [
      evolution({ id: "evo-1", text: "Não deve aparecer" }),
    ]);

    expect(view.kind).toBe("procedure");
    expect(view.text).toBe("Restauração");
    expect(view.dateLabel).toBe("11/08/2026");
  });

  it("consulta sem nome cai na evolução vinculada", () => {
    const view = resolveLastProcedure({ ...completed, procedureName: "  " }, [
      evolution({
        id: "evo-new",
        text: "Mais recente geral",
        createdAt: "2026-08-20T12:00:00-03:00",
      }),
      evolution({
        id: "evo-linked",
        text: "Restauração no 36",
        createdAt: "2026-08-11T16:00:00-03:00",
        appointmentId: "apt-1",
      }),
    ]);

    expect(view.kind).toBe("evolution");
    expect(view.evolutionId).toBe("evo-linked");
    expect(view.text).toBe("Restauração no 36");
  });

  it("sem consulta concluída usa a última evolução", () => {
    const view = resolveLastProcedure(null, [
      evolution({
        id: "evo-old",
        text: "Antiga",
        createdAt: "2026-01-01T12:00:00-03:00",
      }),
      evolution({
        id: "evo-new",
        text: "Última evolução",
        createdAt: "2026-08-20T12:00:00-03:00",
      }),
    ]);

    expect(view.kind).toBe("evolution");
    expect(view.text).toBe("Última evolução");
  });

  it("vazio quando não há concluída nem evolução com texto", () => {
    const view = resolveLastProcedure(null, [
      evolution({ id: "blank", text: "   " }),
    ]);

    expect(view).toEqual({
      kind: "empty",
      dateLabel: null,
      text: PATIENT_CARD_COPY.missingProcedure,
      evolutionId: null,
    });
  });

  it("corta trecho da evolução em 120 caracteres com reticências", () => {
    const long = "a".repeat(200);
    const view = resolveLastProcedure(null, [
      evolution({ id: "long", text: long }),
    ]);

    expect(view.text).toHaveLength(120);
    expect(view.text.endsWith("...")).toBe(true);
  });
});

describe("excerptEvolution", () => {
  it("trim só espaços vira ausência de texto", () => {
    expect(excerptEvolution("   ")).toBeNull();
  });
});
