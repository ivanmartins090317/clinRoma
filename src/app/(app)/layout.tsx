import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { MenuChipsAoVivo } from "@/components/layout/menu-chips-ao-vivo";
import { Toaster } from "@/components/ui/sonner";
import { assertRouteAccess } from "@/lib/auth/guard";
import { getAllowedModuleIds } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname");
  const session = await requireAuthSession(pathname ?? "/acesso-negado");

  // Sem x-pathname não assume /hoje: auxiliar sem Hoje entrava em loop 307.
  if (pathname) {
    assertRouteAccess(session, pathname);
  }

  return (
    <AppShell
      allowedModuleIds={getAllowedModuleIds(session.profile.role)}
      displayName={session.profile.displayName}
      role={session.profile.role}
      chips={<MenuChipsAoVivo role={session.profile.role} />}
    >
      {children}
      <Toaster />
    </AppShell>
  );
}
