import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { getAppointmentStatusLabel } from "@/features/agenda/domain/appointment-status";
import {
  formatClinicTime,
  groupAppointmentsByDentist,
  type AgendaAppointment,
  type AgendaDentist,
} from "@/features/agenda/types";
import { ReminderStatusBadge } from "@/features/reminders/components/reminder-status-badge";
import type { ReminderSummary } from "@/features/reminders/queries";
import { Button } from "@/components/ui/button";

interface TodayAppointmentsCardProps {
  appointments: AgendaAppointment[];
  dentists: AgendaDentist[];
  remindersByAppointmentId: Record<string, ReminderSummary>;
}

export function TodayAppointmentsCard({
  appointments,
  dentists,
  remindersByAppointmentId,
}: TodayAppointmentsCardProps) {
  const groups = groupAppointmentsByDentist(appointments, dentists);

  return (
    <section className="rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 shadow-neo md:p-5.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[17px] font-bold text-foreground">
            Consultas de hoje
          </h3>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            {appointments.length === 0
              ? "Nenhuma consulta hoje"
              : `${appointments.length} consulta(s) ativa(s)`}
          </p>
        </div>
        <Button asChild variant="secondary" size="sm" className="min-h-11">
          <Link href="/agenda">
            <CalendarDays aria-hidden />
            Abrir agenda completa
          </Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <p className="mt-5 text-sm text-neo-ink-3">
          Nenhuma consulta hoje. Use a agenda para marcar horários.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {groups.map((group) => (
            <div key={group.dentist.id}>
              <div className="mb-2 flex items-center gap-2 text-[14.5px] font-bold">
                <span
                  className="size-2.25 shrink-0 rounded-full"
                  style={{ backgroundColor: group.dentist.calendarColor }}
                  aria-hidden
                />
                {group.dentist.fullName}
              </div>
              <ul className="space-y-2">
                {group.appointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-col gap-2 rounded-[9px] border border-neo-cream-line bg-neo-cream-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold">
                        {appointment.patientName}
                      </p>
                      <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                        {formatClinicTime(appointment.startsAt)} ·{" "}
                        {formatClinicTime(appointment.endsAt)}
                        {appointment.procedureName
                          ? ` · ${appointment.procedureName}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
                      <span className="text-sm text-muted-foreground">
                        {getAppointmentStatusLabel(appointment.status)}
                      </span>
                      {appointment.status === "completed" ? (
                        <ReminderStatusBadge
                          reminder={remindersByAppointmentId[appointment.id]}
                        />
                      ) : null}
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="min-h-11 w-full sm:w-auto"
                      >
                        <Link
                          href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
                        >
                          Abrir prontuário
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
