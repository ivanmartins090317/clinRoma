import { parseGatewaySessionPayload } from "@/features/whatsapp/domain/session-status";
import { readWhatsAppWebhookSecret } from "@/features/whatsapp/domain/webhook-hmac";
import {
  readWhatsAppChannelConfig,
  type WhatsAppChannelConfig,
} from "@/lib/whatsapp/send-whatsapp";

export type WahaSessionError = "channel_absent" | "request_failed";

export type WahaSessionResult =
  { ok: true } | { ok: false; error: WahaSessionError };

export type WahaQrResult =
  { ok: true; bytes: Uint8Array } | { ok: false; error: WahaSessionError };

export type WahaStatusResult =
  | { ok: true; status: string }
  | { ok: false; error: WahaSessionError };

export interface WahaSessionWebhook {
  url: string;
  secret: string;
}

export interface WahaSessionDeps {
  fetchFn?: typeof fetch;
  readConfig?: () => WhatsAppChannelConfig | null;
  readWebhook?: () => WahaSessionWebhook | null;
}

interface WahaRequestOptions {
  accept?: string;
  body?: unknown;
}

const REQUEST_TIMEOUT_MS = 15_000;

let startInFlight: Promise<WahaSessionResult> | null = null;

function gatewayUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function isPublicHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    return parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

export function readWahaSessionWebhook(
  env: Record<string, string | undefined> = process.env,
): WahaSessionWebhook | null {
  const secret = readWhatsAppWebhookSecret(env);
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

  if (!secret || !isPublicHttpUrl(appUrl)) return null;

  return {
    url: `${appUrl.replace(/\/$/, "")}/api/webhooks/waha`,
    secret,
  };
}

export function buildCreateSessionBody(
  session: string,
  webhook: WahaSessionWebhook | null,
) {
  if (!webhook) {
    return { name: session, start: true };
  }

  return {
    name: session,
    start: true,
    config: {
      webhooks: [
        {
          url: webhook.url,
          events: ["session.status"],
          hmac: { key: webhook.secret },
        },
      ],
    },
  };
}

async function wahaRequest(
  config: WhatsAppChannelConfig,
  method: "GET" | "POST",
  path: string,
  deps: WahaSessionDeps,
  options: WahaRequestOptions = {},
): Promise<Response> {
  const fetchFn = deps.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetchFn(gatewayUrl(config.url, path), {
      method,
      headers: {
        "X-Api-Key": config.key,
        ...(options.accept ? { Accept: options.accept } : {}),
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function postSessionAction(
  pathBuilder: (session: string) => string,
  deps: WahaSessionDeps,
): Promise<WahaSessionResult> {
  const config = (deps.readConfig ?? readWhatsAppChannelConfig)();

  if (!config) {
    return { ok: false, error: "channel_absent" };
  }

  try {
    const response = await wahaRequest(
      config,
      "POST",
      pathBuilder(config.session),
      deps,
    );

    if (response.ok || response.status === 422) {
      return { ok: true };
    }

    return { ok: false, error: "request_failed" };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

async function startExistingOrCreate(
  deps: WahaSessionDeps,
): Promise<WahaSessionResult> {
  const config = (deps.readConfig ?? readWhatsAppChannelConfig)();

  if (!config) {
    return { ok: false, error: "channel_absent" };
  }

  try {
    const existing = await wahaRequest(
      config,
      "GET",
      `/api/sessions/${encodeURIComponent(config.session)}`,
      deps,
    );

    if (existing.ok) {
      return postSessionAction(
        (session) => `/api/sessions/${encodeURIComponent(session)}/start`,
        deps,
      );
    }

    if (existing.status !== 404) {
      return { ok: false, error: "request_failed" };
    }

    const webhook = (deps.readWebhook ?? readWahaSessionWebhook)();
    const created = await wahaRequest(config, "POST", "/api/sessions", deps, {
      body: buildCreateSessionBody(config.session, webhook),
    });

    if (created.ok) return { ok: true };

    if (created.status === 422) {
      return postSessionAction(
        (session) => `/api/sessions/${encodeURIComponent(session)}/start`,
        deps,
      );
    }

    return { ok: false, error: "request_failed" };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

export async function startWahaSession(
  deps: WahaSessionDeps = {},
): Promise<WahaSessionResult> {
  if (startInFlight) return startInFlight;

  startInFlight = startExistingOrCreate(deps).finally(() => {
    startInFlight = null;
  });

  return startInFlight;
}

export async function logoutWahaSession(
  deps: WahaSessionDeps = {},
): Promise<WahaSessionResult> {
  return postSessionAction(
    (session) => `/api/sessions/${encodeURIComponent(session)}/logout`,
    deps,
  );
}

export async function fetchWahaSessionStatus(
  deps: WahaSessionDeps = {},
): Promise<WahaStatusResult> {
  const config = (deps.readConfig ?? readWhatsAppChannelConfig)();

  if (!config) {
    return { ok: false, error: "channel_absent" };
  }

  try {
    const response = await wahaRequest(
      config,
      "GET",
      `/api/sessions/${encodeURIComponent(config.session)}`,
      deps,
    );

    if (response.status === 404) {
      return { ok: true, status: "STOPPED" };
    }

    if (!response.ok) {
      return { ok: false, error: "request_failed" };
    }

    const status = parseGatewaySessionPayload(await response.json());
    if (!status) {
      return { ok: false, error: "request_failed" };
    }

    return { ok: true, status };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

export async function fetchWahaQr(
  deps: WahaSessionDeps = {},
): Promise<WahaQrResult> {
  const config = (deps.readConfig ?? readWhatsAppChannelConfig)();

  if (!config) {
    return { ok: false, error: "channel_absent" };
  }

  try {
    const response = await wahaRequest(
      config,
      "GET",
      `/api/${encodeURIComponent(config.session)}/auth/qr`,
      deps,
      { accept: "image/png" },
    );

    if (!response.ok) {
      return { ok: false, error: "request_failed" };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    return { ok: true, bytes };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}
