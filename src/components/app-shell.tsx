"use client";

import {
  CalendarDays,
  Home,
  LayoutGrid,
  MessageCircle,
  Package,
  PanelLeft,
  QrCode,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ClinicLogo } from "@/components/clinic-logo";
import { MobileAccountMenu } from "@/components/mobile-account-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { LogoutForm } from "@/features/auth/components/logout-form";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { CLINROMA_MODULES, type ClinicModule } from "@/types/clinroma";
import type { UserRole } from "@/types/clinroma";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  allowedModuleIds: readonly string[];
  displayName: string;
  role: UserRole;
  activeDentistCount: number;
  whatsappSessionStatus?: string | null;
  showWhatsAppChip?: boolean;
}

const NAV_ICONS: Record<string, LucideIcon> = {
  today: Home,
  agenda: CalendarDays,
  patients: Users,
  waitlist: LayoutGrid,
  stock: Package,
  "stock-scan": QrCode,
  whatsapp: MessageCircle,
  team: ShieldCheck,
};

const MOBILE_NAV_EXCLUDED_MODULE_IDS = ["stock-scan", "whatsapp", "team"];

/** Módulos da barra inferior mobile (5 itens; Scan QR, WhatsApp e Equipe ficam fora). */
export function getMobileNavModules(
  modules: readonly ClinicModule[],
): ClinicModule[] {
  return modules.filter(
    (module) => !MOBILE_NAV_EXCLUDED_MODULE_IDS.includes(module.id),
  );
}

/** O que sobrou da dock vai para o menu de conta, senão fica sem caminho no celular. */
export function getMobileSecondaryModules(
  modules: readonly ClinicModule[],
): ClinicModule[] {
  return modules.filter((module) =>
    MOBILE_NAV_EXCLUDED_MODULE_IDS.includes(module.id),
  );
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

function EnvChips({
  activeDentistCount,
  showWhatsAppChip = false,
  whatsappSessionStatus = null,
}: {
  activeDentistCount: number;
  showWhatsAppChip?: boolean;
  whatsappSessionStatus?: string | null;
}) {
  const whatsappWorking = whatsappSessionStatus === "WORKING";

  return (
    <div
      aria-label="Estado do sistema"
      className="flex flex-wrap items-center gap-2"
    >
      <span
        className="inline-flex shrink-0 items-center rounded-full border border-[#e5c98d] bg-neo-gold-soft px-2.5 py-1 text-[12.5px] font-bold tracking-[0.04em] text-[#6e4e0e]"
        title="Este ambiente é o piloto do projeto"
      >
        PILOTO
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
        title="Dentistas ativos na clínica"
      >
        <b className="font-semibold text-foreground">{activeDentistCount}</b>
        dentistas ativos
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
        title="Tempo de validade dos links de oferta de horário"
      >
        SLA da fila: <b className="font-semibold text-foreground">40 min</b>
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
        title="Leitura de QR de estoque habilitada"
      >
        <span
          aria-hidden
          className="size-1.75 rounded-full bg-priority-green"
        />
        QR estoque ativo
      </span>
      {showWhatsAppChip ? (
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neo-cream-line bg-neo-cream-soft px-2.5 py-1 text-[12.5px] text-muted-foreground"
          title={
            whatsappWorking
              ? "WhatsApp da clínica conectado"
              : "WhatsApp da clínica desconectado"
          }
        >
          <span
            aria-hidden
            className={
              whatsappWorking
                ? "size-1.75 rounded-full bg-priority-green"
                : "size-1.75 animate-pulse rounded-full bg-priority-red"
            }
          />
          {whatsappWorking ? "WhatsApp ligado" : "WhatsApp desligado"}
        </span>
      ) : null}
    </div>
  );
}

const SIDEBAR_STORAGE_KEY = "clinroma-sidebar-collapsed";

function getInitialSidebarCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

interface SidebarNavProps {
  modules: ClinicModule[];
  pathname: string;
  collapsed: boolean;
}

function SidebarNav({ modules, pathname, collapsed }: SidebarNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "flex flex-1 flex-col gap-0.5 pt-3.5",
        collapsed ? "px-2" : "p-3",
      )}
    >
      {modules.map((module) => {
        const active = isNavActive(pathname, module.href);
        const Icon = NAV_ICONS[module.id] ?? Home;

        return (
          <Link
            key={module.id}
            href={module.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? module.label : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-[10px] border border-transparent py-2.5 text-[14.5px] text-neo-cream-100/90 transition",
              collapsed ? "justify-center px-0" : "gap-2.5 px-3",
              active
                ? "border-neo-gold-500/35 bg-neo-burgundy-700 font-semibold text-neo-white"
                : "hover:bg-white/6",
            )}
          >
            <Icon className="size-4.5 shrink-0 opacity-85" aria-hidden />
            {collapsed ? (
              <span className="sr-only">{module.label}</span>
            ) : (
              module.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  allowedModuleIds,
  displayName,
  role,
  activeDentistCount,
  whatsappSessionStatus = null,
  showWhatsAppChip = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  );
  const visibleModules = filterModulesByAccess(
    CLINROMA_MODULES,
    allowedModuleIds,
  );
  const mobileNavModules = getMobileNavModules(visibleModules);
  const mobileSecondaryModules = getMobileSecondaryModules(visibleModules);
  const roleLabel = getRoleLabel(role);

  function toggleSidebar() {
    setIsSidebarCollapsed((previous) => {
      const next = !previous;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-neo-cream-50">
      <aside
        id="app-sidebar"
        aria-label="Menu lateral"
        suppressHydrationWarning
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-neo-burgundy-950 text-neo-cream-100 transition-[width] duration-200 md:flex",
          isSidebarCollapsed ? "w-18" : "w-62",
        )}
      >
        <div className="absolute top-14 right-1 z-20 -translate-y-1/2 translate-x-1/2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            aria-label={
              isSidebarCollapsed
                ? "Expandir menu lateral"
                : "Recolher menu lateral"
            }
            aria-expanded={!isSidebarCollapsed}
            aria-controls="app-sidebar"
            className="shrink-0 border-neo-burgundy-800/30 bg-neo-burgundy-950 text-neo-cream-100 hover:bg-neo-burgundy-800 hover:text-neo-white"
          >
            <PanelLeft className="size-4.5" aria-hidden />
          </Button>
        </div>
        <div
          className={cn(
            "pb-3.5",
            isSidebarCollapsed ? "px-2 pt-4" : "px-5 pt-5",
          )}
        >
          <Link
            href="/hoje"
            className={cn(
              "inline-block",
              isSidebarCollapsed && "mx-auto flex justify-center",
            )}
          >
            {isSidebarCollapsed ? (
              <Image
                src="/brand/favicon-32.png"
                alt="Clínica Neo Roma"
                width={32}
                height={32}
                priority
                className="size-8"
              />
            ) : (
              <ClinicLogo variant="on-dark" priority className="h-11 w-auto" />
            )}
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center border-b border-white/10",
            isSidebarCollapsed
              ? "justify-center px-2 py-3"
              : "gap-2.5 px-5 pt-1.5 pb-4",
          )}
        >
          <UserAvatar displayName={displayName} variant="sidebar" />
          {!isSidebarCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold">
                {displayName}
              </p>
              <p className="text-[11px] text-[#c8ada1]">{roleLabel}</p>
            </div>
          ) : (
            <span className="sr-only">
              {displayName}, {roleLabel}
            </span>
          )}
        </div>

        <SidebarNav
          modules={visibleModules}
          pathname={pathname}
          collapsed={isSidebarCollapsed}
        />

        <div
          className={cn(
            "border-t border-white/10 pb-4.5",
            isSidebarCollapsed ? "px-2 py-3" : "p-3",
          )}
        >
          <LogoutForm variant="sidebar" compact={isSidebarCollapsed} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="safe-area-top hidden border-b border-neo-cream-line bg-neo-white md:block">
          <div className="flex items-center justify-between gap-4 px-7 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <EnvChips
                activeDentistCount={activeDentistCount}
                showWhatsAppChip={showWhatsAppChip}
                whatsappSessionStatus={whatsappSessionStatus}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2.5 text-sm text-muted-foreground">
              <span>{displayName}</span>
              <UserAvatar displayName={displayName} variant="topbar" />
            </div>
          </div>
        </header>

        <main className="safe-area-top mt-4 flex-1 overflow-x-hidden py-5 sm:py-6 lg:py-8">
          <div className="page-container">{children}</div>
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 px-4 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:hidden">
          {mobileNavModules.length > 0 ? (
            <nav
              aria-label="Navegação principal"
              className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-neo-cream-100/10 bg-neo-burgundy-900/92 p-1.5 shadow-neo-lg backdrop-blur-md"
            >
              {mobileNavModules.map((module) => {
                const active = isNavActive(pathname, module.href);
                const Icon = NAV_ICONS[module.id] ?? Home;

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
            </nav>
          ) : null}

          <MobileAccountMenu
            displayName={displayName}
            role={role}
            modules={mobileSecondaryModules}
            icons={NAV_ICONS}
          />
        </div>
      </div>
    </div>
  );
}
