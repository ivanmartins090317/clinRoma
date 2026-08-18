"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type SlotInfo,
  type View,
  Views,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

import type { ReschedulePayload } from "@/features/agenda/components/reschedule-confirm-dialog";
import {
  CLINIC_TIMEZONE,
  type AgendaCalendarEvent,
  type AgendaDentist,
} from "@/features/agenda/types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop<AgendaCalendarEvent, CalendarResource>(
  Calendar,
);

interface CalendarResource {
  resourceId: string;
  resourceTitle: string;
}

interface AgendaCalendarProps {
  events: AgendaCalendarEvent[];
  dentists: AgendaDentist[];
  selectedDate: string;
  canWrite: boolean;
  onSelectSlot: (slot: {
    date: string;
    startTime: string;
    endTime: string;
    dentistId: string;
  }) => void;
  onSelectEvent: (event: AgendaCalendarEvent) => void;
  onRescheduleRequest: (payload: ReschedulePayload) => void;
}

function toClinicTime(date: Date): string {
  return format(toZonedTime(date, CLINIC_TIMEZONE), "HH:mm");
}

function toClinicDate(date: Date): string {
  return format(toZonedTime(date, CLINIC_TIMEZONE), "yyyy-MM-dd");
}

export function AgendaCalendar({
  events,
  dentists,
  selectedDate,
  canWrite,
  onSelectSlot,
  onSelectEvent,
  onRescheduleRequest,
}: AgendaCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);

  const resources = useMemo<CalendarResource[]>(
    () =>
      dentists.map((dentist) => ({
        resourceId: dentist.id,
        resourceTitle: dentist.fullName,
      })),
    [dentists],
  );

  const currentDate = useMemo(
    () => toZonedTime(`${selectedDate}T12:00:00`, CLINIC_TIMEZONE),
    [selectedDate],
  );

  function handleSelectSlot(slotInfo: SlotInfo) {
    if (!canWrite || !slotInfo.resourceId) {
      return;
    }

    onSelectSlot({
      date: toClinicDate(slotInfo.start),
      startTime: toClinicTime(slotInfo.start),
      endTime: toClinicTime(slotInfo.end),
      dentistId: String(slotInfo.resourceId),
    });
  }

  function handleEventDrop(args: {
    event: AgendaCalendarEvent;
    start: Date | string;
    end: Date | string;
    resourceId?: string | number;
  }) {
    if (!canWrite) {
      return;
    }

    const start =
      args.start instanceof Date ? args.start : new Date(args.start);
    const end = args.end instanceof Date ? args.end : new Date(args.end);
    const dentistId = String(args.resourceId ?? args.event.resourceId);

    onRescheduleRequest({
      id: args.event.id,
      patientName: args.event.patientName,
      dentistId,
      startsAt: start,
      endsAt: end,
    });
  }

  return (
    <div className="agenda-calendar min-w-0 max-w-full space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={
            view === Views.DAY
              ? "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              : "rounded-md border border-border px-3 py-2 text-sm"
          }
          onClick={() => setView(Views.DAY)}
        >
          Dia
        </button>
        <button
          type="button"
          className={
            view === Views.WEEK
              ? "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              : "rounded-md border border-border px-3 py-2 text-sm"
          }
          onClick={() => setView(Views.WEEK)}
        >
          Semana
        </button>
      </div>

      <div className="h-[70vh] min-h-[32rem] max-w-full overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-card p-2">
        <div className="h-full min-w-max">
          <DnDCalendar
            localizer={localizer}
            culture="pt-BR"
            events={events}
            resources={resources}
            resourceIdAccessor={(resource: CalendarResource) =>
              resource.resourceId
            }
            resourceTitleAccessor={(resource: CalendarResource) =>
              resource.resourceTitle
            }
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            date={currentDate}
            view={view}
            onView={setView}
            views={[Views.DAY, Views.WEEK]}
            step={30}
            timeslots={2}
            min={toZonedTime(`${selectedDate}T07:00:00`, CLINIC_TIMEZONE)}
            max={toZonedTime(`${selectedDate}T20:00:00`, CLINIC_TIMEZONE)}
            selectable={canWrite}
            draggableAccessor={() => canWrite}
            resizable={false}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event) => onSelectEvent(event)}
            onEventDrop={handleEventDrop}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.dentistColor,
                borderColor: event.dentistColor,
                color: "#fff",
              },
            })}
            messages={{
              today: "Hoje",
              previous: "Anterior",
              next: "Próximo",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Hora",
              event: "Consulta",
              noEventsInRange: "Nenhuma consulta neste período",
            }}
          />
        </div>
      </div>
    </div>
  );
}
