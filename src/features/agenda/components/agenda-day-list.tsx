"use client";

import { getAppointmentStatusLabel } from "@/features/agenda/domain/appointment-status";
import {
  formatClinicDateTime,
  formatClinicTime,
} from "@/features/agenda/types";
import type {
  AgendaAppointment,
  AgendaDayGroup,
} from "@/features/agenda/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AgendaDayListProps {
  groups: AgendaDayGroup[];
  onSelectAppointment: (appointment: AgendaAppointment) => void;
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
              <li key={appointment.id}>
                <button
                  type="button"
                  onClick={() => onSelectAppointment(appointment)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-neo-gold-500/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {appointment.patientName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatClinicTime(appointment.startsAt)} ·{" "}
                        {formatClinicTime(appointment.endsAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(appointment.status)}>
                      {getAppointmentStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                  {appointment.procedureName ? (
                    <p className="text-sm text-muted-foreground">
                      {appointment.procedureName}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function AgendaTodaySummaryItem({
  appointment,
}: {
  appointment: AgendaAppointment;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
      <div>
        <p className="font-medium">{appointment.patientName}</p>
        <p className="text-sm text-muted-foreground">
          {appointment.dentistName} ·{" "}
          {formatClinicDateTime(appointment.startsAt)}
        </p>
      </div>
      <Badge variant={statusVariant(appointment.status)}>
        {getAppointmentStatusLabel(appointment.status)}
      </Badge>
    </div>
  );
}
