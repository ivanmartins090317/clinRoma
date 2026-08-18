"use server";

import { revalidatePath } from "next/cache";

import {
  processReminderById,
  resetReminderForManualResend,
} from "@/features/reminders/lib/send-reminder-email";
import { resendReminderSchema } from "@/features/reminders/schemas";
import { requireAuthSession } from "@/lib/auth/session";

export interface ReminderActionResult {
  success?: boolean;
  error?: string;
}

export async function resendReminderAction(
  input: unknown,
): Promise<ReminderActionResult> {
  try {
    const session = await requireAuthSession("/hoje");

    if (session.profile.role !== "admin") {
      return { error: "Sem permissão para reenviar lembrete" };
    }

    const parsed = resendReminderSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    await resetReminderForManualResend(parsed.data.reminderId);
    await processReminderById(parsed.data.reminderId);

    revalidatePath("/hoje");
    revalidatePath("/agenda");

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível reenviar lembrete",
    };
  }
}
