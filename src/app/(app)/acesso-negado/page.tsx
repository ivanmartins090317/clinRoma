import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDefaultAppPath } from "@/lib/auth/roles";
import { getAuthSession } from "@/lib/auth/session";

export const metadata = { title: "Acesso negado" };

export default async function AccessDeniedPage() {
  const session = await getAuthSession();
  const homeHref = session
    ? getDefaultAppPath(session.profile.role)
    : "/login";

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
        <Link href={homeHref}>Voltar ao início</Link>
      </Button>
    </div>
  );
}
