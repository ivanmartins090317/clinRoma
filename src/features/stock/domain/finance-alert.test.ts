import { describe, expect, it } from "vitest";

import {
  canProcessFinanceAlert,
  didEnterReplenishment,
  didLeaveReplenishment,
  hasOpenEpisodeAlert,
  isValidFinanceAlertDestination,
  maskEmail,
  needsReplenishment,
  shouldCallEmailProvider,
  shouldCancelPendingFinanceAlert,
  shouldCreateAlertOnScan,
  shouldEnqueueFinanceAlert,
} from "@/features/stock/domain/finance-alert";

describe("needsReplenishment", () => {
  it("precisa quando o saldo é menor que o mínimo maior que zero", () => {
    expect(needsReplenishment({ currentQuantity: 2, minimumQuantity: 5 })).toBe(
      true,
    );
  });

  it("precisa quando está zerado e o mínimo é maior que zero", () => {
    expect(needsReplenishment({ currentQuantity: 0, minimumQuantity: 5 })).toBe(
      true,
    );
  });

  it("não precisa quando o mínimo é zero, mesmo com saldo zero", () => {
    expect(needsReplenishment({ currentQuantity: 0, minimumQuantity: 0 })).toBe(
      false,
    );
  });

  it("não precisa quando o saldo é igual ao mínimo", () => {
    expect(needsReplenishment({ currentQuantity: 5, minimumQuantity: 5 })).toBe(
      false,
    );
  });

  it("não precisa quando o saldo é maior que o mínimo", () => {
    expect(
      needsReplenishment({ currentQuantity: 10, minimumQuantity: 5 }),
    ).toBe(false);
  });
});

describe("transição de episódio", () => {
  const ok = { currentQuantity: 10, minimumQuantity: 5 };
  const low = { currentQuantity: 2, minimumQuantity: 5 };
  const zeroed = { currentQuantity: 0, minimumQuantity: 5 };
  const equal = { currentQuantity: 5, minimumQuantity: 5 };
  const noMin = { currentQuantity: 0, minimumQuantity: 0 };

  it("cruzou quando passa a precisar de reposição", () => {
    expect(didEnterReplenishment(ok, low)).toBe(true);
    expect(didEnterReplenishment(ok, zeroed)).toBe(true);
    expect(didEnterReplenishment(equal, low)).toBe(true);
  });

  it("não cruzou se já precisava ou se continua ok", () => {
    expect(didEnterReplenishment(low, zeroed)).toBe(false);
    expect(didEnterReplenishment(ok, equal)).toBe(false);
    expect(didEnterReplenishment(noMin, noMin)).toBe(false);
  });

  it("saiu quando deixa de precisar de reposição", () => {
    expect(didLeaveReplenishment(low, ok)).toBe(true);
    expect(didLeaveReplenishment(zeroed, equal)).toBe(true);
    expect(didLeaveReplenishment(low, noMin)).toBe(true);
  });

  it("não saiu se continua precisando", () => {
    expect(didLeaveReplenishment(low, zeroed)).toBe(false);
    expect(didLeaveReplenishment(ok, ok)).toBe(false);
  });
});

describe("destino do financeiro", () => {
  it("rejeita ausente, vazio, só espaços e formato inválido", () => {
    expect(isValidFinanceAlertDestination(null)).toBe(false);
    expect(isValidFinanceAlertDestination(undefined)).toBe(false);
    expect(isValidFinanceAlertDestination("")).toBe(false);
    expect(isValidFinanceAlertDestination("   ")).toBe(false);
    expect(isValidFinanceAlertDestination("lixo")).toBe(false);
    expect(isValidFinanceAlertDestination("sem-arroba.com")).toBe(false);
  });

  it("aceita um endereço com formato válido", () => {
    expect(isValidFinanceAlertDestination("financeiro@clinica.com")).toBe(true);
  });

  it("não chama o provedor quando o destino é inválido", () => {
    expect(shouldCallEmailProvider(false)).toBe(false);
    expect(shouldCallEmailProvider(true)).toBe(true);
  });
});

describe("idempotência do episódio", () => {
  it("enfileira só na entrada, com destino válido e sem episódio aberto", () => {
    expect(
      shouldEnqueueFinanceAlert({
        enteredReplenishment: true,
        destinationValid: true,
        hasOpenEpisode: false,
      }),
    ).toBe(true);
  });

  it("não enfileira segunda queda no mesmo episódio", () => {
    expect(
      shouldEnqueueFinanceAlert({
        enteredReplenishment: false,
        destinationValid: true,
        hasOpenEpisode: true,
      }),
    ).toBe(false);
    expect(
      shouldEnqueueFinanceAlert({
        enteredReplenishment: true,
        destinationValid: true,
        hasOpenEpisode: true,
      }),
    ).toBe(false);
  });

  it("não enfileira com destino vazio", () => {
    expect(
      shouldEnqueueFinanceAlert({
        enteredReplenishment: true,
        destinationValid: false,
        hasOpenEpisode: false,
      }),
    ).toBe(false);
  });

  it("cancela pendente ao sair de reposição", () => {
    expect(
      shouldCancelPendingFinanceAlert({
        leftReplenishment: true,
        hasOpenPending: true,
      }),
    ).toBe(true);
    expect(
      shouldCancelPendingFinanceAlert({
        leftReplenishment: true,
        hasOpenPending: false,
      }),
    ).toBe(false);
  });

  it("enviado permanece no episódio aberto até encerrar", () => {
    expect(hasOpenEpisodeAlert({ status: "sent", episodeClosedAt: null })).toBe(
      true,
    );
    expect(
      hasOpenEpisodeAlert({
        status: "sent",
        episodeClosedAt: "2026-08-26T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("varredura cria uma vez por episódio e não recria com episódio aberto", () => {
    expect(
      shouldCreateAlertOnScan({
        needsReplenishment: true,
        destinationValid: true,
        hasOpenEpisode: false,
      }),
    ).toBe(true);
    expect(
      shouldCreateAlertOnScan({
        needsReplenishment: true,
        destinationValid: true,
        hasOpenEpisode: true,
      }),
    ).toBe(false);
  });

  it("novo episódio (saiu e entrou) pode enfileirar de novo", () => {
    expect(
      shouldEnqueueFinanceAlert({
        enteredReplenishment: true,
        destinationValid: true,
        hasOpenEpisode: false,
      }),
    ).toBe(true);
  });
});

describe("canProcessFinanceAlert", () => {
  const now = new Date("2026-08-26T12:00:00.000Z");

  it("processa pendente cuja próxima tentativa já chegou", () => {
    expect(
      canProcessFinanceAlert({
        status: "pending",
        attemptCount: 0,
        nextAttemptAt: now,
        now,
      }),
    ).toBe(true);
  });

  it("não processa enviado, falho ou cancelado", () => {
    const base = {
      attemptCount: 1,
      nextAttemptAt: now,
      now,
    };

    expect(canProcessFinanceAlert({ ...base, status: "sent" })).toBe(false);
    expect(canProcessFinanceAlert({ ...base, status: "failed" })).toBe(false);
    expect(canProcessFinanceAlert({ ...base, status: "cancelled" })).toBe(
      false,
    );
  });
});

describe("maskEmail", () => {
  it("mascara o local e preserva o domínio", () => {
    expect(maskEmail("financeiro@clinica.com")).toBe("f***@clinica.com");
  });
});
