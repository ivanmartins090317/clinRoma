"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppointmentDetail } from "@/features/agenda/components/appointment-detail";
import { AppointmentForm } from "@/features/agenda/components/appointment-form";
import { AgendaDateNav } from "@/features/agenda/components/agenda-date-nav";
import { AgendaDentistFilter } from "@/features/agenda/components/agenda-dentist-filter";
import { AgendaRangeFilter } from "@/features/agenda/components/agenda-range-filter";
import { AgendaRangeList } from "@/features/agenda/components/agenda-range-list";
import {
  RescheduleConfirmDialog,
  type ReschedulePayload,
} from "@/features/agenda/components/reschedule-confirm-dialog";
import { groupAppointmentsByClinicDay } from "@/features/agenda/domain/agenda-range";
import {
  toCalendarEvents,
  type AgendaAppointment,
  type AgendaCalendarEvent,
  type AgendaDentist,
} from "@/features/agenda/types";
import type { ReminderSummary } from "@/features/reminders/queries";
import { Button } from "@/components/ui/button";

const AgendaCalendar = dynamic(
  () =>
    import("@/features/agenda/components/agenda-calendar").then(
      (module) => module.AgendaCalendar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Carregando calendário...
      </div>
    ),
  },
);

interface AgendaViewProps {
  canWrite: boolean;
  canOpenWhatsApp?: boolean;
  linkedDentistId: string | null;
  dentists: AgendaDentist[];
  selectedDate: string;
  todayDate: string;
  dentistFilter: string;
  rangeFrom: string;
  rangeTo: string;
  rangeWasClamped: boolean;
  rangeIsExplicit: boolean;
  rangeAppointments: AgendaAppointment[];
  weekAppointments: AgendaAppointment[];
  dateNavigation: {
    previous: string;
    current: string;
    next: string;
  };
  remindersByAppointmentId: Record<string, ReminderSummary>;
}

export function AgendaView({
  canWrite,
  canOpenWhatsApp = false,
  linkedDentistId,
  dentists,
  selectedDate,
  todayDate,
  dentistFilter,
  rangeFrom,
  rangeTo,
  rangeWasClamped,
  rangeIsExplicit,
  rangeAppointments,
  weekAppointments,
  dateNavigation,
  remindersByAppointmentId,
}: AgendaViewProps) {
  const router = useRouter();
  const [selectedAppointment, setSelectedAppointment] =
    useState<AgendaAppointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formAppointment, setFormAppointment] =
    useState<AgendaAppointment | null>(null);
  const [formInitial, setFormInitial] = useState<
    | {
        dentistId: string;
        date: string;
        startTime: string;
        endTime: string;
      }
    | undefined
  >();
  const [reschedulePayload, setReschedulePayload] =
    useState<ReschedulePayload | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const mobileDentistFilter =
    dentistFilter !== "all"
      ? dentistFilter
      : !canWrite && linkedDentistId
        ? linkedDentistId
        : "all";

  const filteredRangeAppointments = useMemo(() => {
    if (mobileDentistFilter === "all") {
      return rangeAppointments;
    }

    return rangeAppointments.filter(
      (appointment) => appointment.dentistId === mobileDentistFilter,
    );
  }, [rangeAppointments, mobileDentistFilter]);

  const rangeDays = useMemo(
    () => groupAppointmentsByClinicDay(filteredRangeAppointments, dentists),
    [filteredRangeAppointments, dentists],
  );

  const calendarDentists = useMemo(() => {
    if (mobileDentistFilter === "all") {
      return dentists;
    }

    return dentists.filter((dentist) => dentist.id === mobileDentistFilter);
  }, [dentists, mobileDentistFilter]);

  const calendarEvents = useMemo(() => {
    const events = toCalendarEvents(weekAppointments);

    if (mobileDentistFilter === "all") {
      return events;
    }

    return events.filter((event) => event.resourceId === mobileDentistFilter);
  }, [weekAppointments, mobileDentistFilter]);

  function refreshAgenda() {
    router.refresh();
  }

  function openCreateForm(slot?: {
    date: string;
    startTime: string;
    endTime: string;
    dentistId: string;
  }) {
    setFormAppointment(null);
    setFormInitial(slot);
    setFormOpen(true);
  }

  function openDetail(appointment: AgendaAppointment) {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  }

  function openEdit(appointment: AgendaAppointment) {
    setDetailOpen(false);
    setFormAppointment(appointment);
    setFormInitial(undefined);
    setFormOpen(true);
  }

  function handleCalendarEventSelect(event: AgendaCalendarEvent) {
    const appointment = weekAppointments.find((item) => item.id === event.id);

    if (appointment) {
      openDetail(appointment);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-neo-cream-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-[1.875rem]">
            Agenda
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Calendário multi-dentista com consultas do dia e da semana.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={() => openCreateForm()}>Nova consulta</Button>
        ) : null}
      </section>

      <div className="flex flex-col gap-4">
        <div className="md:hidden">
          <AgendaRangeFilter
            key={`${rangeFrom}:${rangeTo}`}
            from={rangeFrom}
            to={rangeTo}
            dentistFilter={mobileDentistFilter}
            wasClamped={rangeWasClamped}
          />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AgendaDateNav
            className="hidden md:flex"
            previousDate={dateNavigation.previous}
            currentDate={dateNavigation.current}
            nextDate={dateNavigation.next}
            dentistFilter={mobileDentistFilter}
            todayDate={todayDate}
          />
          <AgendaDentistFilter
            dentists={dentists}
            selectedDate={selectedDate}
            value={mobileDentistFilter}
            from={rangeIsExplicit ? rangeFrom : undefined}
            to={rangeIsExplicit ? rangeTo : undefined}
          />
        </div>
      </div>

      <div className="md:hidden">
        <AgendaRangeList
          days={rangeDays}
          onSelectAppointment={openDetail}
          canOpenWhatsApp={canOpenWhatsApp}
        />
      </div>

      <div className="hidden md:block">
        <AgendaCalendar
          events={calendarEvents}
          dentists={calendarDentists}
          selectedDate={selectedDate}
          canWrite={canWrite}
          onSelectSlot={(slot) => openCreateForm(slot)}
          onSelectEvent={handleCalendarEventSelect}
          onRescheduleRequest={(payload) => {
            setReschedulePayload(payload);
            setRescheduleOpen(true);
          }}
        />
      </div>

      <AppointmentDetail
        appointment={selectedAppointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canWrite={canWrite}
        canOpenWhatsApp={canOpenWhatsApp}
        dentists={dentists}
        reminder={
          selectedAppointment
            ? remindersByAppointmentId[selectedAppointment.id]
            : null
        }
        onEdit={openEdit}
        onCancelled={refreshAgenda}
      />

      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        dentists={dentists}
        appointment={formAppointment}
        initialValues={{
          ...formInitial,
          date: formInitial?.date ?? selectedDate,
        }}
        onSuccess={refreshAgenda}
      />

      <RescheduleConfirmDialog
        payload={reschedulePayload}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={refreshAgenda}
        onCancel={refreshAgenda}
      />
    </div>
  );
}
