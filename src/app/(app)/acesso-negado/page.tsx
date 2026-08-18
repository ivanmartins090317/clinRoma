import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Acesso negado" };

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-neo-gray-200 bg-neo-white p-8 text-center shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-muted">
        Erro 403
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-neo-burgundy-900">
        Acesso negado
      </h1>
      <p className="mt-3 text-sm text-brand-muted">
        Seu papel de colaborador não permite acessar este módulo. Se acredita
        que isso é um engano, fale com o administrador da clínica.
      </p>
      <Button asChild className="mt-6 min-h-11">
        <Link href="/hoje">Voltar ao início</Link>
      </Button>
    </div>
  );
}
