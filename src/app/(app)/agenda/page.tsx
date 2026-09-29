import { AgendaView } from "@/features/agenda/components/agenda-view";
import {
  clinicRangeBounds,
  resolveAgendaDateRange,
} from "@/features/agenda/domain/agenda-range";
import {
  clinicDateNavigation,
  clinicWeekBounds,
  formatClinicDate,
  getActiveDentists,
  getAppointmentsInRange,
  getLinkedDentistId,
  parseClinicDateParam,
} from "@/features/agenda/queries";
import { getRemindersByAppointmentIds } from "@/features/reminders/queries";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";

export const metadata = { title: "Agenda" };

interface AgendaPageProps {
  searchParams: Promise<{
    date?: string;
    dentist?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = await searchParams;
  const session = await requireAuthSession("/agenda");
  const canWrite = getModuleAccess(session.profile.role, "agenda") === "write";
  const linkedDentistId = await getLinkedDentistId(session.userId);
  const selectedDate = parseClinicDateParam(params.date);
  const formattedDate = formatClinicDate(selectedDate);
  const todayDate = formatClinicDate(parseClinicDateParam(undefined));
  const dentistFilter = params.dentist ?? "all";
  const range = resolveAgendaDateRange(params.from, params.to, formattedDate);
  const calendarMoment = range.isExplicit
    ? parseClinicDateParam(range.from)
    : selectedDate;

  const dentists = await getActiveDentists();
  const rangeBounds = clinicRangeBounds(range.from, range.to);
  const weekBounds = clinicWeekBounds(calendarMoment);

  const [rangeAppointments, weekAppointments] = await Promise.all([
    getAppointmentsInRange(rangeBounds.start, rangeBounds.end, null),
    getAppointmentsInRange(weekBounds.start, weekBounds.end, null),
  ]);

  const appointmentIds = [
    ...new Set(
      [...rangeAppointments, ...weekAppointments].map(
        (appointment) => appointment.id,
      ),
    ),
  ];
  const remindersByAppointmentId =
    await getRemindersByAppointmentIds(appointmentIds);

  return (
    <AgendaView
      canWrite={canWrite}
      linkedDentistId={linkedDentistId}
      dentists={dentists}
      selectedDate={formatClinicDate(calendarMoment)}
      todayDate={todayDate}
      dentistFilter={dentistFilter}
      rangeFrom={range.from}
      rangeTo={range.to}
      rangeWasClamped={range.wasClamped}
      rangeIsExplicit={range.isExplicit}
      rangeAppointments={rangeAppointments}
      weekAppointments={weekAppointments}
      dateNavigation={clinicDateNavigation(calendarMoment)}
      remindersByAppointmentId={remindersByAppointmentId}
    />
  );
}
