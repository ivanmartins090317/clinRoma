import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { getActiveDentists } from "@/features/agenda/queries";
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

  const [allowedModuleIds, dentists] = await Promise.all([
    Promise.resolve(getAllowedModuleIds(session.profile.role)),
    getActiveDentists(),
  ]);

  return (
    <AppShell
      allowedModuleIds={allowedModuleIds}
      displayName={session.profile.displayName}
      role={session.profile.role}
      activeDentistCount={dentists.length}
    >
      {children}
      <Toaster />
    </AppShell>
  );
}
