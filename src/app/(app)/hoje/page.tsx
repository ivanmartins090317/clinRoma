import Link from "next/link";
import { CalendarIcon } from "lucide-react";

import { AgendaTodaySummaryItem } from "@/features/agenda/components/agenda-day-list";
import { getAppointmentStatusLabel } from "@/features/agenda/domain/appointment-status";
import {
  formatClinicTime,
  groupAppointmentsByDentist,
} from "@/features/agenda/types";
import {
  getActiveDentists,
  getTodayAppointments,
} from "@/features/agenda/queries";
import { ClinicLogo } from "@/components/clinic-logo";
import { Button } from "@/components/ui/button";
import { WAITLIST_COLORS } from "@/types/clinroma";

export const metadata = {
  title: "Hoje",
};

export default async function HojePage() {
  const [dentists, appointments] = await Promise.all([
    getActiveDentists(),
    getTodayAppointments(),
  ]);

  const grouped = groupAppointmentsByDentist(appointments, dentists);
  const chronological = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Hoje
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Consultas do dia, fila Kanban e atalhos operacionais.
          </p>
        </div>
        <ClinicLogo
          variant="on-light"
          className="h-9 w-auto shrink-0 self-start opacity-90 sm:self-auto"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Consultas de hoje</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {appointments.length === 0
                ? "Nenhuma consulta hoje"
                : `${appointments.length} consulta(s) ativa(s)`}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/agenda">
              <CalendarIcon />
              Abrir agenda completa
            </Link>
          </Button>
        </div>

        {appointments.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma consulta hoje. Use a agenda para marcar horários.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="space-y-3 md:hidden">
              {chronological.map((appointment) => (
                <div key={appointment.id} className="space-y-2">
                  <AgendaTodaySummaryItem appointment={appointment} />
                  <Link
                    href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Abrir prontuário
                  </Link>
                </div>
              ))}
            </div>

            <div className="hidden space-y-5 md:block">
              {grouped.map((group) => (
                <div key={group.dentist.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: group.dentist.calendarColor }}
                      aria-hidden
                    />
                    <h4 className="font-medium">{group.dentist.fullName}</h4>
                  </div>
                  <ul className="space-y-2">
                    {group.appointments.map((appointment) => (
                      <li
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">
                            {appointment.patientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatClinicTime(appointment.startsAt)} ·{" "}
                            {formatClinicTime(appointment.endsAt)}
                            {appointment.procedureName
                              ? ` · ${appointment.procedureName}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-muted-foreground">
                            {getAppointmentStatusLabel(appointment.status)}
                          </span>
                          <Link
                            href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Abrir prontuário
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold text-foreground">Fila · prioridades</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(WAITLIST_COLORS).map(([key, color]) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <span
                className={`h-3 w-3 rounded-full ${color.className}`}
                aria-hidden
              />
              {color.label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Slot liberado: botão ou arrastar no Kanban. Paciente recebe link (40
          min, LGPD).
        </p>
      </section>
    </div>
  );
}
