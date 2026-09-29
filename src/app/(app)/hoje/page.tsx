import { Suspense } from "react";

import { HomeHero } from "@/components/layout/home-hero";
import { canSeeWhatsAppStatusCard } from "@/features/whatsapp/permissions";
import { canAccessModule, getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import type { UserRole } from "@/types/clinroma";

import { ConsultasDoDia } from "./consultas-do-dia";
import { EstoqueAbaixoDoMinimo } from "./estoque-abaixo-do-minimo";
import { FalhasDeLembrete } from "./falhas-de-lembrete";
import { FilaAguardando } from "./fila-aguardando";
import { BlocoEntrada, LugarReservado } from "./lugar-reservado";
import { NumerosDoDia } from "./numeros-do-dia";
import { WhatsappDoDia } from "./whatsapp-do-dia";

export const metadata = {
  title: "Hoje",
};

export const ORDEM_BLOCO = {
  saudacao: 0,
  numeros: 1,
  whatsapp: 2,
  consultas: 3,
  falhas: 4,
  fila: 5,
  estoque: 6,
} as const;

export type BlocoHoje = keyof typeof ORDEM_BLOCO;

const BLOCOS_DE_TODOS: BlocoHoje[] = [
  "saudacao",
  "numeros",
  "consultas",
  "fila",
  "estoque",
];

export function blocosDaHoje(role: UserRole): BlocoHoje[] {
  const blocos = [...BLOCOS_DE_TODOS];

  if (canSeeWhatsAppStatusCard(role)) {
    blocos.splice(blocos.indexOf("numeros") + 1, 0, "whatsapp");
  }

  if (role === "admin") {
    blocos.splice(blocos.indexOf("consultas") + 1, 0, "falhas");
  }

  return blocos;
}

interface SessaoDaHoje {
  displayName: string;
  role: UserRole;
  showCreateAppointment: boolean;
  showScanShortcut: boolean;
}

function BlocoDaPagina({
  bloco,
  sessao,
}: {
  bloco: BlocoHoje;
  sessao: SessaoDaHoje;
}) {
  if (bloco === "saudacao") {
    return (
      <BlocoEntrada ordem={ORDEM_BLOCO.saudacao}>
        <HomeHero
          displayName={sessao.displayName}
          showCreateAppointment={sessao.showCreateAppointment}
          showScanShortcut={sessao.showScanShortcut}
        />
      </BlocoEntrada>
    );
  }

  if (bloco === "numeros") {
    return (
      <Suspense fallback={<LugarReservado variante="numeros" />}>
        <NumerosDoDia ordem={ORDEM_BLOCO.numeros} />
      </Suspense>
    );
  }

  if (bloco === "whatsapp") {
    return (
      <Suspense fallback={<LugarReservado variante="cartao" />}>
        <WhatsappDoDia role={sessao.role} ordem={ORDEM_BLOCO.whatsapp} />
      </Suspense>
    );
  }

  if (bloco === "consultas") {
    return (
      <Suspense fallback={<LugarReservado variante="cartao" />}>
        <ConsultasDoDia ordem={ORDEM_BLOCO.consultas} />
      </Suspense>
    );
  }

  if (bloco === "falhas") {
    return (
      <Suspense fallback={<LugarReservado variante="cartao" />}>
        <FalhasDeLembrete ordem={ORDEM_BLOCO.falhas} />
      </Suspense>
    );
  }

  if (bloco === "fila") {
    return (
      <Suspense fallback={<LugarReservado variante="cartao" />}>
        <FilaAguardando ordem={ORDEM_BLOCO.fila} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LugarReservado variante="cartao" />}>
      <EstoqueAbaixoDoMinimo ordem={ORDEM_BLOCO.estoque} />
    </Suspense>
  );
}

export default async function HojePage() {
  const session = await requireAuthSession("/hoje");
  const role = session.profile.role;
  const sessao: SessaoDaHoje = {
    displayName: session.profile.displayName,
    role,
    showCreateAppointment: getModuleAccess(role, "agenda") === "write",
    showScanShortcut: canAccessModule(role, "stock-scan"),
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {blocosDaHoje(role).map((bloco) => (
        <BlocoDaPagina key={bloco} bloco={bloco} sessao={sessao} />
      ))}
    </div>
  );
}
