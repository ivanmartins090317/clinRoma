import { TodayAppointmentsCard } from "@/features/agenda/components/today-appointments-card";
import {
  getActiveDentists,
  getTodayAppointments,
} from "@/features/agenda/queries";
import { getRemindersByAppointmentIds } from "@/features/reminders/queries";

import { BlocoEntrada, LugarFalha } from "./lugar-reservado";

export async function ConsultasDoDia({ ordem }: { ordem: number }) {
  const dados = await Promise.all([
    getActiveDentists(),
    getTodayAppointments(),
  ]).catch(() => null);

  if (!dados) {
    return (
      <BlocoEntrada ordem={ordem}>
        <LugarFalha variante="cartao" />
      </BlocoEntrada>
    );
  }

  const [dentists, appointments] = dados;
  const remindersByAppointmentId = await getRemindersByAppointmentIds(
    appointments.map((appointment) => appointment.id),
  ).catch(() => null);

  if (!remindersByAppointmentId) {
    return (
      <BlocoEntrada ordem={ordem}>
        <LugarFalha variante="cartao" />
      </BlocoEntrada>
    );
  }

  return (
    <BlocoEntrada ordem={ordem}>
      <TodayAppointmentsCard
        appointments={appointments}
        dentists={dentists}
        remindersByAppointmentId={remindersByAppointmentId}
      />
    </BlocoEntrada>
  );
}
