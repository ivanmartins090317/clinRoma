import { AgendaView } from "@/features/agenda/components/agenda-view";
import {
  clinicDateNavigation,
  clinicDayBounds,
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

  const dentists = await getActiveDentists();
  const dayBounds = clinicDayBounds(selectedDate);
  const weekBounds = clinicWeekBounds(selectedDate);

  const [dayAppointments, weekAppointments] = await Promise.all([
    getAppointmentsInRange(dayBounds.start, dayBounds.end, null),
    getAppointmentsInRange(weekBounds.start, weekBounds.end, null),
  ]);

  const appointmentIds = [
    ...new Set(
      [...dayAppointments, ...weekAppointments].map(
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
      selectedDate={formattedDate}
      todayDate={todayDate}
      dentistFilter={dentistFilter}
      dayAppointments={dayAppointments}
      weekAppointments={weekAppointments}
      dateNavigation={clinicDateNavigation(selectedDate)}
      remindersByAppointmentId={remindersByAppointmentId}
    />
  );
}
