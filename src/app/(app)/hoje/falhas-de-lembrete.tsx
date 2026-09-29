import { ReminderFailuresPanel } from "@/features/reminders/components/reminder-failures-panel";
import { getRecentFailedReminders } from "@/features/reminders/queries";

import { BlocoEntrada, LugarFalha } from "./lugar-reservado";

export async function FalhasDeLembrete({ ordem }: { ordem: number }) {
  const failures = await getRecentFailedReminders().catch(() => null);

  if (!failures) {
    return (
      <BlocoEntrada ordem={ordem}>
        <LugarFalha variante="cartao" />
      </BlocoEntrada>
    );
  }

  return (
    <BlocoEntrada ordem={ordem}>
      <ReminderFailuresPanel failures={failures} />
    </BlocoEntrada>
  );
}
