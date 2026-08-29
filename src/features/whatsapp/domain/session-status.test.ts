import { describe, expect, it } from "vitest";

import {
  CLINIC_WHATSAPP_SESSION,
  isScanQrStatus,
  isSessionWorking,
  isStartingStatus,
  isStoppedStatus,
  mapGatewayStatusToDomain,
  parseGatewaySessionPayload,
  parseSessionStatusEvent,
  shouldRefreshPairing,
} from "@/features/whatsapp/domain/session-status";

describe("mapGatewayStatusToDomain", () => {
  it("mapeia SCAN_QR_CODE do gateway para SCAN_QR", () => {
    expect(mapGatewayStatusToDomain("SCAN_QR_CODE")).toBe("SCAN_QR");
    expect(mapGatewayStatusToDomain("scan_qr_code")).toBe("SCAN_QR");
  });

  it("mantém WORKING e STOPPED", () => {
    expect(mapGatewayStatusToDomain("WORKING")).toBe("WORKING");
    expect(mapGatewayStatusToDomain("STOPPED")).toBe("STOPPED");
  });

  it("deixa falha e chave de acesso no balde não WORKING, sem status extra", () => {
    expect(mapGatewayStatusToDomain("FAILED")).toBe("FAILED");
    expect(mapGatewayStatusToDomain("PASSKEY_REQUIRED")).toBe(
      "PASSKEY_REQUIRED",
    );
    expect(isSessionWorking("FAILED")).toBe(false);
    expect(isSessionWorking("PASSKEY_REQUIRED")).toBe(false);
    expect(isScanQrStatus("FAILED")).toBe(false);
    expect(isScanQrStatus("PASSKEY_REQUIRED")).toBe(false);
  });

  it("linha ausente trata como não em operação", () => {
    expect(isSessionWorking(null)).toBe(false);
    expect(isSessionWorking(undefined)).toBe(false);
    expect(isScanQrStatus(null)).toBe(false);
    expect(isStoppedStatus(null)).toBe(false);
  });

  it("atualiza a tela de pareamento em STARTING e SCAN_QR", () => {
    expect(isStartingStatus("STARTING")).toBe(true);
    expect(shouldRefreshPairing("STARTING")).toBe(true);
    expect(shouldRefreshPairing("SCAN_QR")).toBe(true);
    expect(shouldRefreshPairing("WORKING")).toBe(false);
    expect(shouldRefreshPairing("STOPPED")).toBe(false);
  });

  it("lê o status bruto da sessão no gateway", () => {
    expect(parseGatewaySessionPayload({ status: "SCAN_QR_CODE" })).toBe(
      "SCAN_QR",
    );
    expect(parseGatewaySessionPayload({ name: "default" })).toBeNull();
  });
});

describe("parseSessionStatusEvent", () => {
  it("aceita aviso de mudança de sessão da clínica", () => {
    expect(
      parseSessionStatusEvent({
        event: "session.status",
        session: CLINIC_WHATSAPP_SESSION,
        payload: { status: "SCAN_QR_CODE" },
      }),
    ).toEqual({
      sessionName: "default",
      status: "SCAN_QR",
    });
  });

  it("ignora aviso de outro tipo", () => {
    expect(
      parseSessionStatusEvent({
        event: "message.any",
        session: "default",
        payload: { status: "WORKING" },
      }),
    ).toBeNull();
  });

  it("ignora aviso sem status", () => {
    expect(
      parseSessionStatusEvent({
        event: "session.status",
        session: "default",
        payload: {},
      }),
    ).toBeNull();
  });
});
