import { readNumberExists } from "@/features/whatsapp/domain/chat-link";
import {
  maskWhatsAppDestination,
  readWhatsAppChannelConfig,
  type WhatsAppChannelConfig,
} from "@/lib/whatsapp/send-whatsapp";

export type CheckWhatsAppNumberStatus =
  | "exists"
  | "missing"
  | "session_down"
  | "channel_unavailable";

export interface CheckWhatsAppNumberResult {
  status: CheckWhatsAppNumberStatus;
}

export interface CheckWhatsAppNumberDeps {
  fetchFn?: typeof fetch;
  readConfig?: () => WhatsAppChannelConfig | null;
}

const CHECK_TIMEOUT_MS = 15_000;

function gatewayCheckUrl(config: WhatsAppChannelConfig, digits: string): string {
  const base = config.url.replace(/\/$/, "");
  const params = new URLSearchParams({
    phone: digits,
    session: config.session,
  });
  return `${base}/api/contacts/check-exists?${params.toString()}`;
}

function flatten(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(flatten).join(" ");
  }
  return "";
}

export function indicatesStoppedSession(body: unknown): boolean {
  const text = flatten(body);
  if (!/session/i.test(text)) return false;
  return /not as expected|stopped|failed|not working|scan_qr|starting/i.test(text);
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function logCheckFailure(digits: string, reason: string) {
  console.error(
    "[whatsapp] consulta de número falhou",
    maskWhatsAppDestination(digits),
    reason,
  );
}

export async function checkWhatsAppNumber(
  digits: string,
  deps: CheckWhatsAppNumberDeps = {},
): Promise<CheckWhatsAppNumberResult> {
  const config = (deps.readConfig ?? readWhatsAppChannelConfig)();
  if (!config) {
    logCheckFailure(digits, "channel_absent");
    return { status: "channel_unavailable" };
  }

  const fetchFn = deps.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetchFn(gatewayCheckUrl(config, digits), {
      method: "GET",
      headers: { "X-Api-Key": config.key },
      signal: controller.signal,
    });
    const body = await readBody(response);

    if (!response.ok) {
      if (indicatesStoppedSession(body)) {
        logCheckFailure(digits, "session_down");
        return { status: "session_down" };
      }

      logCheckFailure(digits, "http");
      return { status: "channel_unavailable" };
    }

    const reading = readNumberExists(body);
    if (reading === "exists") return { status: "exists" };
    if (reading === "missing") return { status: "missing" };

    logCheckFailure(digits, "unexpected_body");
    return { status: "channel_unavailable" };
  } catch {
    logCheckFailure(digits, "request_failed");
    return { status: "channel_unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
