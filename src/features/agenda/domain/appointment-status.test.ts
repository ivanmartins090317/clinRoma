import { describe, expect, it } from "vitest";

import {
  getAppointmentStatusLabel,
  WRITABLE_APPOINTMENT_STATUSES,
} from "@/features/agenda/domain/appointment-status";

describe("appointment-status", () => {
  it("permite marcar consulta como concluída no formulário", () => {
    expect(WRITABLE_APPOINTMENT_STATUSES).toContain("completed");
    expect(getAppointmentStatusLabel("completed")).toBe("Concluído");
  });

  it("não oferece cancelado nem remarcado no select (têm fluxo próprio)", () => {
    expect(WRITABLE_APPOINTMENT_STATUSES).not.toContain("cancelled");
    expect(WRITABLE_APPOINTMENT_STATUSES).not.toContain("rescheduled");
  });
});
