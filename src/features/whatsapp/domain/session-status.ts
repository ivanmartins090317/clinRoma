export const CLINIC_WHATSAPP_SESSION = "default";

export const WHATSAPP_SESSION_STATUS = {
  WORKING: "WORKING",
  STOPPED: "STOPPED",
  SCAN_QR: "SCAN_QR",
} as const;

export type WhatsAppSessionStatusValue =
  (typeof WHATSAPP_SESSION_STATUS)[keyof typeof WHATSAPP_SESSION_STATUS];

export const SESSION_STATUS_EVENT = "session.status";

export interface SessionStatusEvent {
  sessionName: string;
  status: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function mapGatewayStatusToDomain(raw: string): string {
  const normalized = raw.trim().toUpperCase();

  if (normalized === "SCAN_QR_CODE" || normalized === "SCAN_QR") {
    return WHATSAPP_SESSION_STATUS.SCAN_QR;
  }

  if (normalized === WHATSAPP_SESSION_STATUS.WORKING) {
    return WHATSAPP_SESSION_STATUS.WORKING;
  }

  if (normalized === WHATSAPP_SESSION_STATUS.STOPPED) {
    return WHATSAPP_SESSION_STATUS.STOPPED;
  }

  return normalized;
}

export function isSessionWorking(status: string | null | undefined): boolean {
  return status === WHATSAPP_SESSION_STATUS.WORKING;
}

export function isScanQrStatus(status: string | null | undefined): boolean {
  return status === WHATSAPP_SESSION_STATUS.SCAN_QR;
}

export function isStoppedStatus(status: string | null | undefined): boolean {
  return status === WHATSAPP_SESSION_STATUS.STOPPED;
}

export function isStartingStatus(status: string | null | undefined): boolean {
  return status === "STARTING";
}

export function shouldRefreshPairing(
  status: string | null | undefined,
): boolean {
  return isScanQrStatus(status) || isStartingStatus(status);
}

export function parseGatewaySessionPayload(payload: unknown): string | null {
  const record = asRecord(payload);
  if (typeof record?.status !== "string" || !record.status.trim()) return null;
  return mapGatewayStatusToDomain(record.status);
}

export function isSessionStatusEvent(event: string | undefined): boolean {
  return event === SESSION_STATUS_EVENT;
}

export function parseSessionStatusEvent(
  body: unknown,
): SessionStatusEvent | null {
  const record = asRecord(body);
  if (!record) return null;

  if (typeof record.event !== "string" || !isSessionStatusEvent(record.event)) {
    return null;
  }

  const payload = asRecord(record.payload);
  const rawStatus = typeof payload?.status === "string" ? payload.status : null;

  if (!rawStatus?.trim()) return null;

  const sessionName =
    typeof record.session === "string" && record.session.trim()
      ? record.session.trim()
      : CLINIC_WHATSAPP_SESSION;

  return {
    sessionName,
    status: mapGatewayStatusToDomain(rawStatus),
  };
}
