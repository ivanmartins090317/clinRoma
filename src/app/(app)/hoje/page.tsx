import Link from "next/link";
import { CalendarDays } from "lucide-react";

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
import { HomeHero } from "@/components/layout/home-hero";
import { StatCard } from "@/components/layout/stat-card";
import { WhatsAppStatusCard } from "@/features/whatsapp/components/whatsapp-status-card";
import {
  canOpenWhatsAppPairing,
  canSeeWhatsAppStatusCard,
} from "@/features/whatsapp/permissions";
import { getClinicWhatsAppSessionStatus } from "@/features/whatsapp/queries";
import { ReminderFailuresPanel } from "@/features/reminders/components/reminder-failures-panel";
import { ReminderStatusBadge } from "@/features/reminders/components/reminder-status-badge";
import {
  getRecentFailedReminders,
  getRemindersByAppointmentIds,
} from "@/features/reminders/queries";
import { getStockAlerts } from "@/features/stock/queries";
import { SUPPLY_UNIT_LABELS } from "@/features/stock/lib/clinic-date";
import { getWaitlistSummary } from "@/features/waitlist/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WAITLIST_COLORS } from "@/types/clinroma";
import { canAccessModule } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";

export const metadata = {
  title: "Hoje",
};

export default async function HojePage() {
  const session = await requireAuthSession("/hoje");
  const isAdmin = session.profile.role === "admin";
  const showScanShortcut = canAccessModule(session.profile.role, "stock-scan");
  const showWhatsAppCard = canSeeWhatsAppStatusCard(session.profile.role);

  const [
    dentists,
    appointments,
    waitlistSummary,
    stockAlerts,
    failedReminders,
    whatsappSessionStatus,
  ] = await Promise.all([
    getActiveDentists(),
    getTodayAppointments(),
    getWaitlistSummary(),
    getStockAlerts(),
    isAdmin ? getRecentFailedReminders() : Promise.resolve([]),
    showWhatsAppCard ? getClinicWhatsAppSessionStatus() : Promise.resolve(null),
  ]);

  const remindersByAppointmentId = await getRemindersByAppointmentIds(
    appointments.map((appointment) => appointment.id),
  );

  const grouped = groupAppointmentsByDentist(appointments, dentists);
  const chronological = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const expiringCount = waitlistSummary.expiringSoon.length;

  return (
    <div className="space-y-5 md:space-y-6">
      <HomeHero
        displayName={session.profile.displayName}
        showScanShortcut={showScanShortcut}
      />

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <StatCard
          href="/agenda"
          value={appointments.length}
          label="Consultas hoje"
          hint={
            appointments.length === 0
              ? "Nenhuma consulta agendada"
              : `${appointments.length} ativa(s)`
          }
        />
        <StatCard
          href="/fila"
          value={waitlistSummary.totalWaiting}
          label="Na fila"
          hint={
            waitlistSummary.totalWaiting === 0
              ? "Ninguém aguardando"
              : "Aguardando encaixe"
          }
        />
        <StatCard
          href="/fila"
          value={expiringCount}
          label="Ofertas expirando"
          hint="Links perto de vencer"
          warn={expiringCount > 0}
        />
        <StatCard
          href="/estoque"
          value={stockAlerts.length}
          label="Estoque crítico"
          hint="Abaixo do mínimo"
          warn={stockAlerts.length > 0}
        />
      </section>

      {showWhatsAppCard ? (
        <WhatsAppStatusCard
          status={whatsappSessionStatus}
          showPairingLink={canOpenWhatsAppPairing(session.profile.role)}
        />
      ) : null}

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
          <div className="mt-5 space-y-5">
            <div className="space-y-3.5 md:hidden">
              {chronological.map((appointment) => (
                <div key={appointment.id} className="space-y-2">
                  <div className="rounded-[9px] border border-neo-cream-line bg-neo-cream-soft px-4 py-3">
                    <AgendaTodaySummaryItem appointment={appointment} />
                  </div>
                  {appointment.status === "completed" ? (
                    <ReminderStatusBadge
                      reminder={remindersByAppointmentId[appointment.id]}
                    />
                  ) : null}
                  <Link
                    href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-neo-burgundy-800 underline-offset-4 hover:underline"
                  >
                    Abrir prontuário
                  </Link>
                </div>
              ))}
            </div>

            <div className="hidden space-y-4 md:block">
              {grouped.map((group) => (
                <div key={group.dentist.id}>
                  <div className="mb-2 flex items-center gap-2 text-[14.5px] font-bold">
                    <span
                      className="size-2.25 rounded-full"
                      style={{ backgroundColor: group.dentist.calendarColor }}
                      aria-hidden
                    />
                    {group.dentist.fullName}
                  </div>
                  <ul className="space-y-2">
                    {group.appointments.map((appointment) => (
                      <li
                        key={appointment.id}
                        className="flex items-center justify-between gap-3.5 rounded-[9px] border border-neo-cream-line bg-neo-cream-soft px-4 py-3"
                      >
                        <div>
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
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-muted-foreground">
                            {getAppointmentStatusLabel(appointment.status)}
                          </span>
                          {appointment.status === "completed" ? (
                            <ReminderStatusBadge
                              reminder={
                                remindersByAppointmentId[appointment.id]
                              }
                            />
                          ) : null}
                          <Link
                            href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
                            className="text-[13.5px] font-semibold text-neo-burgundy-800 underline-offset-4 hover:underline"
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

      {isAdmin ? <ReminderFailuresPanel failures={failedReminders} /> : null}

      <section className="rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 shadow-neo md:p-5.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-foreground">
              Fila · aguardando
            </h3>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              {waitlistSummary.totalWaiting === 0
                ? "Nenhum paciente aguardando encaixe"
                : `${waitlistSummary.totalWaiting} paciente(s) na fila`}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="min-h-11">
            <Link href="/fila">Abrir fila</Link>
          </Button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {Object.entries(WAITLIST_COLORS).map(([key, color]) => {
            const count =
              waitlistSummary.waitingByPriority[
                key as keyof typeof waitlistSummary.waitingByPriority
              ];
            const badgeVariant =
              key === "red"
                ? "destructive"
                : key === "yellow"
                  ? "warning"
                  : "success";

            return (
              <Badge key={key} variant={badgeVariant} dot>
                {count} {color.label.toLowerCase()}
              </Badge>
            );
          })}
        </div>

        {waitlistSummary.expiringSoon.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {waitlistSummary.expiringSoon.map((item) => (
              <li
                key={item.entryId}
                className="rounded-[9px] border border-[#ecd9a8] bg-[#fdf6e4] px-3.5 py-2.5 text-sm text-[#5f430e]"
              >
                Oferta de {item.patientName} expira em {item.minutesLeft} min
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 shadow-neo md:p-5.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-foreground">
              Estoque · abaixo do mínimo
            </h3>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              {stockAlerts.length === 0
                ? "Nenhum insumo abaixo do mínimo"
                : `${stockAlerts.length} insumo(s) precisam de reposição`}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="min-h-11">
            <Link href="/estoque">Abrir estoque</Link>
          </Button>
        </div>

        {stockAlerts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {stockAlerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-col gap-2.5 rounded-[9px] border border-[#ecd9a8] bg-[#fdf6e4] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-[#5f430e]">
                    {alert.name}
                  </p>
                  <p className="text-xs font-semibold text-priority-yellow">
                    {alert.currentQuantity} de {alert.minimumQuantity}{" "}
                    {SUPPLY_UNIT_LABELS[alert.unit]}
                  </p>
                </div>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="min-h-11 w-full sm:w-auto"
                >
                  <Link href="/estoque">Ver insumo</Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-neo-ink-3">
            Nenhum insumo abaixo do mínimo.
          </p>
        )}
      </section>
    </div>
  );
}
