import { z } from "zod";

export const resendReminderSchema = z.object({
  reminderId: z.string().uuid("Lembrete inválido"),
});

export type ResendReminderInput = z.infer<typeof resendReminderSchema>;
