import { z } from "zod";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_VISION_MODEL = "gpt-4o";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_SUGGESTED_PURCHASE_LINES = 40;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const UNIT_ALIASES: Record<string, "unit" | "box" | "roll" | "bottle"> = {
  unit: "unit",
  unitario: "unit",
  unitário: "unit",
  un: "unit",
  und: "unit",
  unidade: "unit",
  box: "box",
  caixa: "box",
  cx: "box",
  roll: "roll",
  rolo: "roll",
  bottle: "bottle",
  frasco: "bottle",
};

const rawLineSchema = z.object({
  name: z.string().optional(),
  quantityPerPackage: z.unknown().optional(),
  packageCount: z.unknown().optional(),
  lotNumber: z.unknown().optional(),
  expiresAt: z.unknown().optional(),
  unit: z.unknown().optional(),
});

const visionPayloadSchema = z.object({
  lines: z.array(rawLineSchema).optional(),
});

export interface ExtractedPurchaseLine {
  name: string;
  quantityPerPackage: number | null;
  packageCount: number | null;
  lotNumber: string | null;
  expiresAt: string | null;
  unit: "unit" | "box" | "roll" | "bottle" | null;
}

export interface ExtractPurchaseSheetResult {
  ok: boolean;
  lines?: ExtractedPurchaseLine[];
  truncated?: boolean;
  model?: string;
  error?: string;
}

export interface PurchaseSheetFileMeta {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export function validatePurchaseSheetFile(
  meta: PurchaseSheetFileMeta,
): { ok: true } | { ok: false; error: string } {
  if (!meta.fileName.trim()) {
    return { ok: false, error: "Selecione um arquivo" };
  }

  if (!ALLOWED_MIME.has(meta.mimeType)) {
    return {
      ok: false,
      error: "Use JPEG, PNG ou WebP",
    };
  }

  if (meta.fileSizeBytes > MAX_FILE_BYTES) {
    return { ok: false, error: "Arquivo acima de 10 MB" };
  }

  return { ok: true };
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return null;
}

function parsePositiveInt(value: unknown): number | null {
  const number = parsePositiveNumber(value);
  if (number === null) return null;
  if (!Number.isInteger(number)) return null;
  return number;
}

function parseLot(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseExpiresAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const date = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== trimmed) return null;

  return trimmed;
}

function parseUnit(value: unknown): "unit" | "box" | "roll" | "bottle" | null {
  if (typeof value !== "string") return null;
  const key = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  return UNIT_ALIASES[key] ?? null;
}

/**
 * Valida o JSON da leitura: descarta campos inválidos, limita a 40 linhas.
 * Não inventa quantidade, data ou unidade.
 */
export function sanitizeExtractedPurchaseLines(payload: unknown): {
  lines: ExtractedPurchaseLine[];
  truncated: boolean;
} {
  const parsed = visionPayloadSchema.safeParse(payload);
  const rawLines = parsed.success ? (parsed.data.lines ?? []) : [];

  const lines: ExtractedPurchaseLine[] = [];

  for (const raw of rawLines) {
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) continue;

    lines.push({
      name,
      quantityPerPackage: parsePositiveNumber(raw.quantityPerPackage),
      packageCount: parsePositiveInt(raw.packageCount),
      lotNumber: parseLot(raw.lotNumber),
      expiresAt: parseExpiresAt(raw.expiresAt),
      unit: parseUnit(raw.unit),
    });

    if (lines.length >= MAX_SUGGESTED_PURCHASE_LINES) break;
  }

  return {
    lines,
    truncated: rawLines.length > MAX_SUGGESTED_PURCHASE_LINES,
  };
}

function getVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
}

export async function extractPurchaseSheetFromImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<ExtractPurchaseSheetResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = getVisionModel();

  if (!apiKey) {
    return {
      ok: false,
      error: "OPENAI_API_KEY não configurada no servidor",
      model,
    };
  }

  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const systemPrompt = [
    "Você lê notas ou planilhas de compra de insumos odontológicos.",
    'Responda só JSON no formato {"lines":[...]} .',
    "Cada linha pode ter: name (string), quantityPerPackage (número),",
    "packageCount (inteiro), lotNumber (string), expiresAt (YYYY-MM-DD),",
    "unit (unit|box|roll|bottle ou unitario|caixa|rolo|frasco).",
    "Se não reconhecer um campo com certeza, omita-o. Não invente valores.",
    `No máximo ${MAX_SUGGESTED_PURCHASE_LINES} linhas.`,
  ].join(" ");

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia as linhas de compra desta foto.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Leitura retornou status ${response.status}`,
        model,
      };
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { ok: false, error: "Leitura vazia", model };
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      return { ok: false, error: "Leitura incompreensível", model };
    }

    const { lines, truncated } = sanitizeExtractedPurchaseLines(json);

    if (lines.length === 0) {
      return { ok: false, error: "Leitura vazia", model };
    }

    return { ok: true, lines, truncated, model };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao ler a planilha",
      model,
    };
  }
}
