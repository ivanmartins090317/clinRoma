import {
  readWhatsAppChannelConfig,
  type WhatsAppChannelConfig,
} from "@/lib/whatsapp/send-whatsapp";

export type WahaSessionError = "channel_absent" | "request_failed";

export type WahaSessionResult =
  { ok: true } | { ok: false; error: WahaSessionError };

export type WahaQrResult =
  { ok: true; bytes: Uint8Array } | { ok: false; error: WahaSessionError };

export interface WahaSessionDeps {
  fetchFn?: typeof fetch;
  readConfig?: () => WhatsAppChannelConfig | null;
}

const REQUEST_TIMEOUT_MS = 15_000;

let startInFlight: Promise<WahaSessionResult> | null = null;

function gatewayUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function wahaRequest(
  config: WhatsAppChannelConfig,
  method: "GET" | "POST",
  path: string,
  deps: WahaSessionDeps,
  accept?: string,
): Promise<Response> {
  const fetchFn = deps.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetchFn(gatewayUrl(config.url, path), {
      method,
      headers: {
        "X-Api-Key": config.key,
        ...(accept ? { Accept: accept } : {}),
      },
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

export async function startWahaSession(
  deps: WahaSessionDeps = {},
): Promise<WahaSessionResult> {
  if (startInFlight) return startInFlight;

  startInFlight = postSessionAction(
    (session) => `/api/sessions/${encodeURIComponent(session)}/start`,
    deps,
  ).finally(() => {
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
      "image/png",
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
