"use client";

import { getAppointmentStatusLabel } from "@/features/agenda/domain/appointment-status";
import { formatClinicTime } from "@/features/agenda/types";
import type {
  AgendaAppointment,
  AgendaDayGroup,
} from "@/features/agenda/types";
import { PatientWhatsAppChatButton } from "@/features/whatsapp/components/patient-whatsapp-chat-button";
import { Badge } from "@/components/ui/badge";

interface AgendaDayListProps {
  groups: AgendaDayGroup[];
  onSelectAppointment: (appointment: AgendaAppointment) => void;
  canOpenWhatsApp?: boolean;
  emptyMessage?: string;
}

function statusVariant(
  status: AgendaAppointment["status"],
): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "confirmed":
      return "success";
    case "in_progress":
      return "warning";
    case "cancelled":
    case "no_show":
      return "destructive";
    default:
      return "secondary";
  }
}

export function AgendaDayList({
  groups,
  onSelectAppointment,
  canOpenWhatsApp = false,
  emptyMessage = "Nenhuma consulta neste dia",
}: AgendaDayListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.dentist.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: group.dentist.calendarColor }}
              aria-hidden
            />
            <h3 className="font-semibold text-foreground">
              {group.dentist.fullName}
            </h3>
          </div>

          <ul className="space-y-2">
            {group.appointments.map((appointment) => (
              <li
                key={appointment.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-neo-gold-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectAppointment(appointment)}
                    className="min-h-11 min-w-0 flex-1 text-left"
                  >
                    <p className="font-medium text-foreground">
                      {appointment.patientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatClinicTime(appointment.startsAt)} ·{" "}
                      {formatClinicTime(appointment.endsAt)}
                    </p>
                    {appointment.procedureName ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {appointment.procedureName}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={statusVariant(appointment.status)}>
                      {getAppointmentStatusLabel(appointment.status)}
                    </Badge>
                    <PatientWhatsAppChatButton
                      patientId={appointment.patientId}
                      canOpen={canOpenWhatsApp}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
