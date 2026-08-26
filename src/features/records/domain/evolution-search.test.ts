import { describe, expect, it } from "vitest";

import {
  evolutionMatchesTerm,
  filterEvolutionsByTerm,
  normalizeSearchTerm,
  type EvolutionSearchRecord,
} from "@/features/records/domain/evolution-search";

function evolution(
  overrides: Partial<EvolutionSearchRecord> & Pick<EvolutionSearchRecord, "id">,
): EvolutionSearchRecord {
  return {
    text: "",
    attachments: [],
    ...overrides,
  };
}

const dente24Body = evolution({
  id: "evo-dente-24",
  text: "Extração do dente 24 em sessão única.",
});

const profilaxia = evolution({
  id: "evo-profilaxia",
  text: "Profilaxia e orientação de higiene bucal.",
});

const otherPatient = evolution({
  id: "evo-outro-paciente",
  text: "Restauração do dente 24 no outro paciente.",
});

describe("normalizeSearchTerm", () => {
  it("remove espaços nas pontas", () => {
    expect(normalizeSearchTerm("  dente 24  ")).toBe("dente 24");
  });

  it("trata só espaços como vazio", () => {
    expect(normalizeSearchTerm("   ")).toBe("");
  });
});

describe("evolutionMatchesTerm", () => {
  it("casa o termo no corpo da evolução", () => {
    expect(evolutionMatchesTerm(dente24Body, "dente 24")).toBe(true);
    expect(evolutionMatchesTerm(profilaxia, "dente 24")).toBe(false);
  });

  it("é indiferente a maiúsculas e minúsculas", () => {
    expect(evolutionMatchesTerm(dente24Body, "DENTE 24")).toBe(true);
    expect(evolutionMatchesTerm(dente24Body, "Dente 24")).toBe(true);
  });

  it("usa substring exata: dente 24 não casa dente24 nem dois espaços", () => {
    expect(evolutionMatchesTerm(dente24Body, "dente24")).toBe(false);
    expect(
      evolutionMatchesTerm(
        evolution({ id: "sem-espaco", text: "extração do dente24" }),
        "dente 24",
      ),
    ).toBe(false);
    expect(
      evolutionMatchesTerm(
        evolution({ id: "dois-espacos", text: "extração do dente  24" }),
        "dente 24",
      ),
    ).toBe(false);
  });

  it("ignora espaços nas pontas do termo e do corpo", () => {
    expect(evolutionMatchesTerm(dente24Body, "  dente 24  ")).toBe(true);
    expect(
      evolutionMatchesTerm(
        evolution({ id: "corpo-trim", text: "  extração do dente 24  " }),
        "dente 24",
      ),
    ).toBe(true);
  });

  it("casa transcrição concluída mesmo com corpo sem o termo", () => {
    const withCompleted = evolution({
      id: "evo-audio-ok",
      text: "Evolução só com áudio clínico.",
      attachments: [
        {
          attachmentType: "audio",
          transcriptionStatus: "completed",
          transcription: "extração do dente 24",
        },
      ],
    });

    expect(evolutionMatchesTerm(withCompleted, "dente 24")).toBe(true);
  });

  it("busca o texto vigente da transcrição corrigida", () => {
    const corrected = evolution({
      id: "evo-corrigida",
      text: "Áudio da extração.",
      attachments: [
        {
          attachmentType: "audio",
          transcriptionStatus: "completed",
          transcription: "extração do dente 24",
        },
      ],
    });

    expect(evolutionMatchesTerm(corrected, "dente 24")).toBe(true);
    expect(evolutionMatchesTerm(corrected, "vinte e quatro")).toBe(false);
  });

  it.each(["pending", "processing", "failed"] as const)(
    "não casa transcrição %s mesmo com o termo no texto",
    (status) => {
      const pendingLike = evolution({
        id: `evo-${status}`,
        text: "Evolução sem o termo no corpo.",
        attachments: [
          {
            attachmentType: "audio",
            transcriptionStatus: status,
            transcription: "dente 24 ainda não vigente",
          },
        ],
      });

      expect(evolutionMatchesTerm(pendingLike, "dente 24")).toBe(false);
    },
  );

  it("não casa foto nem áudio sem transcrição", () => {
    const photoOnly = evolution({
      id: "evo-foto",
      text: "Registro fotográfico.",
      attachments: [
        {
          attachmentType: "photo",
          transcriptionStatus: "completed",
          transcription: "dente 24",
        },
      ],
    });
    const audioSemTexto = evolution({
      id: "evo-audio-vazio",
      text: "Áudio sem transcrição.",
      attachments: [
        {
          attachmentType: "audio",
          transcriptionStatus: "completed",
          transcription: "   ",
        },
      ],
    });

    expect(evolutionMatchesTerm(photoOnly, "dente 24")).toBe(false);
    expect(evolutionMatchesTerm(audioSemTexto, "dente 24")).toBe(false);
  });

  it("casa uma vez quando corpo e transcrição têm o termo", () => {
    const both = evolution({
      id: "evo-ambos",
      text: "Retorno do dente 24.",
      attachments: [
        {
          attachmentType: "audio",
          transcriptionStatus: "completed",
          transcription: "revisão do dente 24",
        },
      ],
    });

    expect(evolutionMatchesTerm(both, "dente 24")).toBe(true);
  });
});

describe("filterEvolutionsByTerm", () => {
  const timeline = [profilaxia, dente24Body];

  it("com termo vazio ou só espaços devolve a lista completa na ordem", () => {
    expect(filterEvolutionsByTerm(timeline, "")).toEqual(timeline);
    expect(filterEvolutionsByTerm(timeline, "   ")).toEqual(timeline);
  });

  it("busca dente 24 mostra só a evolução que contém o trecho", () => {
    expect(filterEvolutionsByTerm(timeline, "dente 24")).toEqual([dente24Body]);
  });

  it("não duplica quando várias transcrições casam", () => {
    const severalAudios = evolution({
      id: "evo-varios-audios",
      text: "Dois áudios da mesma sessão.",
      attachments: [
        {
          attachmentType: "audio",
          transcriptionStatus: "completed",
          transcription: "anestesia no dente 24",
        },
        {
          attachmentType: "audio",
          transcriptionStatus: "completed",
          transcription: "sutura após extração do dente 24",
        },
      ],
    });

    expect(
      filterEvolutionsByTerm([severalAudios, profilaxia], "dente 24"),
    ).toEqual([severalAudios]);
  });

  it("não inclui evolução que não estava na lista da ficha", () => {
    const result = filterEvolutionsByTerm(timeline, "dente 24");

    expect(result).toEqual([dente24Body]);
    expect(result.map((item) => item.id)).not.toContain(otherPatient.id);
  });

  it("sem casamento devolve lista vazia", () => {
    expect(filterEvolutionsByTerm(timeline, "xyzzy")).toEqual([]);
  });
});
