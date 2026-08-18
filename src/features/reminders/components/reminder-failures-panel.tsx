"use client";

import { useTransition } from "react";

import { resendReminderAction } from "@/features/reminders/actions";
import { formatClinicDateTime } from "@/features/agenda/types";
import type { FailedReminderItem } from "@/features/reminders/queries";
import { Button } from "@/components/ui/button";

interface ReminderFailuresPanelProps {
  failures: FailedReminderItem[];
}

export function ReminderFailuresPanel({
  failures,
}: ReminderFailuresPanelProps) {
  const [isPending, startTransition] = useTransition();

  function handleResend(reminderId: string) {
    startTransition(async () => {
      await resendReminderAction({ reminderId });
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h3 className="font-semibold text-foreground">Lembretes com falha</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {failures.length === 0
            ? "Nenhuma falha nos últimos 7 dias"
            : `${failures.length} lembrete(s) com falha recente`}
        </p>
      </div>

      {failures.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {failures.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {item.patientName}
                </p>
                <p className="text-muted-foreground">
                  {item.dentistName} · {formatClinicDateTime(item.startsAt)}
                </p>
                {item.errorMessage ? (
                  <p className="mt-1 text-destructive">{item.errorMessage}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleResend(item.id)}
              >
                Reenviar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum lembrete com falha nos últimos 7 dias.
        </p>
      )}
    </section>
  );
}
