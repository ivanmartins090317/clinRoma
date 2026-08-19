"use client";

import {
  Calendar,
  Home,
  LayoutGrid,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ClinicLogo } from "@/components/clinic-logo";
import { CLINROMA_MODULES, type ClinicModule } from "@/types/clinroma";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  allowedModuleIds: readonly string[];
  displayName: string;
  logoutSlot: ReactNode;
}

const MOBILE_NAV_ICONS: Record<string, LucideIcon> = {
  today: Home,
  agenda: Calendar,
  patients: Users,
  waitlist: LayoutGrid,
  stock: Package,
};

/** Módulos da barra inferior mobile (5 itens; Scan QR fica sob Estoque). */
export function getMobileNavModules(
  modules: readonly ClinicModule[],
): ClinicModule[] {
  return modules.filter((module) => module.id !== "stock-scan");
}

export function filterModulesByAccess(
  modules: readonly ClinicModule[],
  allowedModuleIds: readonly string[],
): ClinicModule[] {
  return modules.filter((module) => allowedModuleIds.includes(module.id));
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/hoje") {
    return pathname === "/hoje";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  allowedModuleIds,
  displayName,
  logoutSlot,
}: AppShellProps) {
  const pathname = usePathname();
  const visibleModules = filterModulesByAccess(
    CLINROMA_MODULES,
    allowedModuleIds,
  );
  const mobileNavModules = getMobileNavModules(visibleModules);

  return (
    <div className="flex min-h-screen bg-neo-cream-50">
      <aside className="hidden w-64 shrink-0 bg-neo-burgundy-900 md:block">
        <div className="safe-area-top border-b border-neo-burgundy-800 px-5 py-6 mt-6">
          <Link href="/hoje" className="inline-block">
            <ClinicLogo variant="on-dark" priority className="h-11 w-auto" />
          </Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-neo-gold-400">
            ClinRoma
          </p>
          <p className="mt-0.5 text-sm text-neo-cream-100/80">{displayName}</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {visibleModules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isNavActive(pathname, module.href)
                  ? "bg-neo-burgundy-800 text-neo-cream-100"
                  : "text-neo-cream-100/90 hover:bg-neo-burgundy-800 hover:text-neo-cream-100",
              )}
            >
              {module.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-neo-burgundy-800 p-3">{logoutSlot}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="safe-area-top hidden border-b border-neo-gray-200 bg-neo-white py-3 md:block">
          <div className="page-container flex items-center justify-between gap-4">
            <p className="text-sm text-brand-muted">
              Piloto · 5 dentistas · fila 40 min · QR estoque
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-muted">{displayName}</span>
              {logoutSlot}
            </div>
          </div>
        </header>

        <main className="safe-area-top flex-1 overflow-x-hidden py-5 mt-6 sm:py-6 lg:py-8">
          <div className="page-container">{children}</div>
        </main>

        {mobileNavModules.length > 0 ? (
          <nav
            aria-label="Navegação principal"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:hidden"
          >
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-neo-cream-100/10 bg-neo-burgundy-900/92 p-1.5 shadow-[0_8px_32px_rgba(32,8,12,0.35)] backdrop-blur-md">
              {mobileNavModules.map((module) => {
                const active = isNavActive(pathname, module.href);
                const Icon = MOBILE_NAV_ICONS[module.id] ?? Home;

                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={module.label}
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
                      active
                        ? "bg-neo-gold-500 text-neo-burgundy-950 shadow-sm"
                        : "text-neo-cream-100/65 hover:bg-neo-burgundy-800/80 hover:text-neo-cream-100",
                    )}
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={active ? 2.25 : 1.75}
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
