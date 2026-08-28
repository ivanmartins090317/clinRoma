export interface WhatsAppChannelConfig {
  url: string;
  key: string;
  session: string;
}

export interface SendWhatsAppInput {
  destino: string;
  texto: string;
}

export type SendWhatsAppError = "channel_absent" | "send_failed";

export type SendWhatsAppResult =
  { ok: true } | { ok: false; error: SendWhatsAppError };

export interface SendWhatsAppDeps {
  fetchFn?: typeof fetch;
  readConfig?: () => WhatsAppChannelConfig | null;
}

const SEND_TIMEOUT_MS = 15_000;

export function readWhatsAppChannelConfig(
  env: Record<string, string | undefined> = process.env,
): WhatsAppChannelConfig | null {
  const url = env.WHATSAPP_GATEWAY_URL?.trim() ?? "";
  const key = env.WHATSAPP_GATEWAY_KEY?.trim() ?? "";
  const session = env.WHATSAPP_GATEWAY_SESSION?.trim() ?? "";

  if (!url || !key || !session) {
    return null;
  }

  return { url, key, session };
}

export function isWhatsAppChannelConfigured(): boolean {
  return readWhatsAppChannelConfig() !== null;
}

export function maskWhatsAppDestination(digits: string): string {
  const trimmed = digits.replace(/\D/g, "");
  if (trimmed.length < 8) return "****";
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

function gatewaySendUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/sendText`;
}

export async function sendWhatsApp(
  input: SendWhatsAppInput,
  deps: SendWhatsAppDeps = {},
): Promise<SendWhatsAppResult> {
  const config = (deps.readConfig ?? readWhatsAppChannelConfig)();

  if (!config) {
    return { ok: false, error: "channel_absent" };
  }

  const fetchFn = deps.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetchFn(gatewaySendUrl(config.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": config.key,
      },
      body: JSON.stringify({
        session: config.session,
        chatId: `${input.destino}@c.us`,
        text: input.texto,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logSendFailure(input.destino);
      return { ok: false, error: "send_failed" };
    }

    return { ok: true };
  } catch {
    logSendFailure(input.destino);
    return { ok: false, error: "send_failed" };
  } finally {
    clearTimeout(timer);
  }
}

function logSendFailure(destino: string) {
  console.error("[whatsapp] disparo falhou", maskWhatsAppDestination(destino));
}
