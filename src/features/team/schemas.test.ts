import { describe, expect, it } from "vitest";

import { TEAM_COPY } from "@/features/team/domain/team-guards";
import {
  calendarColorSchema,
  updateCollaboratorProfileSchema,
  updateDentistCardSchema,
} from "@/features/team/schemas";

describe("calendarColorSchema", () => {
  it("aceita #RRGGBB", () => {
    expect(calendarColorSchema.safeParse("#6B2737").success).toBe(true);
    expect(calendarColorSchema.safeParse("#abcdef").success).toBe(true);
  });

  it("recusa formato inválido", () => {
    const short = calendarColorSchema.safeParse("#fff");
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(short.error.issues[0]?.message).toBe(TEAM_COPY.invalidColor);
    }

    expect(calendarColorSchema.safeParse("6B2737").success).toBe(false);
    expect(calendarColorSchema.safeParse("#GGGGGG").success).toBe(false);
  });
});

describe("updateCollaboratorProfileSchema", () => {
  const valid = {
    collaboratorId: "11111111-1111-4111-8111-111111111111",
    displayName: "Dr. Felipe",
    email: "felipe@clinroma.dev",
  };

  it("aceita e-mail e nome válidos", () => {
    const parsed = updateCollaboratorProfileSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("felipe@clinroma.dev");
    }
  });

  it("normaliza e-mail e recusa inválido", () => {
    const upper = updateCollaboratorProfileSchema.safeParse({
      ...valid,
      email: "  Felipe@ClinRoma.DEV ",
    });
    expect(upper.success).toBe(true);
    if (upper.success) {
      expect(upper.data.email).toBe("felipe@clinroma.dev");
    }

    const bad = updateCollaboratorProfileSchema.safeParse({
      ...valid,
      email: "nao-e-email",
    });
    expect(bad.success).toBe(false);
  });
});

describe("updateDentistCardSchema", () => {
  const valid = {
    collaboratorId: "11111111-1111-4111-8111-111111111111",
    fullName: "Dr. Felipe Roma",
    cro: "SP-12345",
    calendarColor: "#6B2737",
    active: true,
  };

  it("aceita ficha válida e normaliza CRO vazio", () => {
    const parsed = updateDentistCardSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const emptyCro = updateDentistCardSchema.safeParse({
      ...valid,
      cro: "  ",
    });
    expect(emptyCro.success).toBe(true);
    if (emptyCro.success) {
      expect(emptyCro.data.cro).toBeNull();
    }
  });

  it("recusa cor inválida", () => {
    const parsed = updateDentistCardSchema.safeParse({
      ...valid,
      calendarColor: "vermelho",
    });
    expect(parsed.success).toBe(false);
  });
});
