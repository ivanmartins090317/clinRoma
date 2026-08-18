import { describe, expect, it } from "vitest";

import {
  formatDentistFirstName,
  formatPartialPatientName,
} from "./partial-patient-name";

describe("partial-patient-name", () => {
  it("mascara nome completo para LGPD", () => {
    expect(formatPartialPatientName("Maria Silva")).toBe("Maria S.");
    expect(formatPartialPatientName("João")).toBe("João");
    expect(formatPartialPatientName("  Ana Paula Costa  ")).toBe("Ana C.");
  });

  it("exibe primeiro nome do dentista", () => {
    expect(formatDentistFirstName("Felipe Roma")).toBe("Felipe");
    expect(formatDentistFirstName(null)).toBe("Dentista da clínica");
  });
});
