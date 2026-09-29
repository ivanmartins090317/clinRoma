import { getTodayAppointments } from "@/features/agenda/queries";
import { getStockAlerts } from "@/features/stock/queries";
import { getWaitlistSummary } from "@/features/waitlist/queries";
import { StatCard } from "@/components/layout/stat-card";

import { BlocoEntrada, LugarFalha } from "./lugar-reservado";

export async function NumerosDoDia({ ordem }: { ordem: number }) {
  const dados = await Promise.all([
    getTodayAppointments(),
    getWaitlistSummary(),
    getStockAlerts(),
  ]).catch(() => null);

  if (!dados) {
    return (
      <BlocoEntrada ordem={ordem}>
        <LugarFalha variante="numeros" />
      </BlocoEntrada>
    );
  }

  const [appointments, waitlistSummary, stockAlerts] = dados;
  const expiringCount = waitlistSummary.expiringSoon.length;

  return (
    <BlocoEntrada ordem={ordem}>
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
    </BlocoEntrada>
  );
}
