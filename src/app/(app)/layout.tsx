import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { LogoutForm } from "@/features/auth/components/logout-form";
import { assertRouteAccess } from "@/lib/auth/guard";
import { getAllowedModuleIds } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/hoje";
  const session = await requireAuthSession(pathname);
  assertRouteAccess(session, pathname);

  const allowedModuleIds = getAllowedModuleIds(session.profile.role);

  return (
    <AppShell
      allowedModuleIds={allowedModuleIds}
      displayName={session.profile.displayName}
      logoutSlot={<LogoutForm />}
    >
      {children}
    </AppShell>
  );
}
