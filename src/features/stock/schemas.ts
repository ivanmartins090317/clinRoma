import { z } from "zod";

export const supplyUnitSchema = z.enum(["unit", "box", "roll", "bottle"]);

export const createSupplySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do insumo"),
  unit: supplyUnitSchema,
  minimumQuantity: z.coerce.number().min(0, "Mínimo inválido"),
  initialQuantity: z.coerce
    .number()
    .min(0, "Saldo inicial inválido")
    .optional()
    .default(0),
});

export const updateSupplySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Informe o nome do insumo"),
  unit: supplyUnitSchema,
  minimumQuantity: z.coerce.number().min(0, "Mínimo inválido"),
});

export const purchaseItemSchema = z.object({
  supplyId: z.string().uuid().optional(),
  newSupply: z
    .object({
      name: z.string().trim().min(1, "Nome obrigatório"),
      unit: supplyUnitSchema,
      minimumQuantity: z.coerce.number().min(0),
    })
    .optional(),
  quantityPerPackage: z.coerce
    .number()
    .positive("Quantidade por pacote inválida"),
  packageCount: z.coerce.number().int().positive("Informe ao menos um pacote"),
  lotNumber: z.string().trim().optional(),
  expiresAt: z.string().optional(),
  bulkQuantity: z.coerce.number().min(0).optional(),
});

export const registerPurchaseSchema = z.object({
  sheetStoragePath: z.string().optional(),
  sheetMimeType: z.string().optional(),
  sheetFileSizeBytes: z.coerce.number().positive().optional(),
  items: z.array(purchaseItemSchema).min(1, "Adicione ao menos um item"),
});

export const addPackageSchema = z.object({
  supplyId: z.string().uuid(),
  quantity: z.coerce.number().positive("Quantidade inválida"),
  lotNumber: z.string().trim().optional(),
  expiresAt: z.string().optional(),
});

export const withdrawPackageSchema = z.object({
  qrCode: z.string().trim().min(1, "QR inválido"),
  quantity: z.coerce.number().positive("Quantidade inválida"),
  allowOverride: z.boolean().optional().default(false),
  notes: z.string().trim().optional(),
});

export const adjustSupplySchema = z.object({
  supplyId: z.string().uuid(),
  quantity: z.coerce.number().positive("Quantidade inválida"),
  direction: z.enum(["increase", "decrease"]),
  notes: z.string().trim().min(1, "Observação obrigatória"),
});

export const uploadSupplySheetSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSizeBytes: z.coerce
    .number()
    .max(10 * 1024 * 1024, "Arquivo acima de 10 MB"),
});

export type CreateSupplyInput = z.infer<typeof createSupplySchema>;
export type UpdateSupplyInput = z.infer<typeof updateSupplySchema>;
export type RegisterPurchaseInput = z.infer<typeof registerPurchaseSchema>;
export type WithdrawPackageInput = z.infer<typeof withdrawPackageSchema>;
export type AdjustSupplyInput = z.infer<typeof adjustSupplySchema>;
