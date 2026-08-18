import { formatInTimeZone } from "date-fns-tz";

import { CLINIC_TIMEZONE } from "@/features/agenda/types";
import type { ReminderSummary } from "@/features/reminders/queries";
import { Badge } from "@/components/ui/badge";

interface ReminderStatusBadgeProps {
  reminder: ReminderSummary | null | undefined;
}

const STATUS_LABELS = {
  pending: "Lembrete pendente",
  sent: "Lembrete enviado",
  failed: "Lembrete falhou",
} as const;

export function ReminderStatusBadge({ reminder }: ReminderStatusBadgeProps) {
  if (!reminder) {
    return null;
  }

  const variant =
    reminder.status === "failed"
      ? "destructive"
      : reminder.status === "sent"
        ? "default"
        : "secondary";

  const sentAtLabel =
    reminder.status === "sent" && reminder.sentAt
      ? formatInTimeZone(reminder.sentAt, CLINIC_TIMEZONE, "dd/MM HH:mm")
      : null;

  return (
    <div className="space-y-1">
      <Badge variant={variant}>{STATUS_LABELS[reminder.status]}</Badge>
      {sentAtLabel ? (
        <p className="text-xs text-muted-foreground">
          Enviado em {sentAtLabel}
        </p>
      ) : null}
      {reminder.status === "failed" ? (
        <p className="text-xs text-muted-foreground">
          Fale com a administração
          {reminder.errorMessage ? `: ${reminder.errorMessage}` : ""}
        </p>
      ) : null}
    </div>
  );
}
