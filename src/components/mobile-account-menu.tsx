"use client";

import { Home, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogoutForm } from "@/features/auth/components/logout-form";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { getInitials } from "@/lib/format/greeting";
import { cn } from "@/lib/utils";
import type { ClinicModule, UserRole } from "@/types/clinroma";

interface MobileAccountMenuProps {
  displayName: string;
  role: UserRole;
  modules: readonly ClinicModule[];
  icons: Record<string, LucideIcon>;
}

export function MobileAccountMenu({
  displayName,
  role,
  modules,
  icons,
}: MobileAccountMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Conta de ${displayName}`}
        className="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full border border-neo-cream-100/10 bg-neo-burgundy-900/92 text-[13px] font-bold text-neo-gold-500 shadow-neo-lg backdrop-blur-md transition-colors hover:bg-neo-burgundy-800"
      >
        {getInitials(displayName)}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className="w-60 border-neo-cream-100/10 bg-neo-burgundy-900/97 p-2 text-neo-cream-100 backdrop-blur-md"
      >
        <div className="border-b border-white/10 px-2 pb-2.5">
          <p className="truncate text-[14px] font-semibold text-neo-white">
            {displayName}
          </p>
          <p className="text-[11.5px] text-[#c8ada1]">{getRoleLabel(role)}</p>
        </div>

        {modules.length > 0 ? (
          <nav aria-label="Mais módulos" className="flex flex-col gap-0.5 py-2">
            {modules.map((module) => {
              const Icon = icons[module.id] ?? Home;
              const active =
                pathname === module.href ||
                pathname.startsWith(`${module.href}/`);

              return (
                <Link
                  key={module.id}
                  href={module.href}
                  aria-current={active ? "page" : undefined}
                  onNavigate={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-[10px] px-2.5 text-[14.5px] transition-colors",
                    active
                      ? "bg-neo-burgundy-700 font-semibold text-neo-white"
                      : "text-neo-cream-100/90 hover:bg-white/8",
                  )}
                >
                  <Icon className="size-4.5 shrink-0 opacity-85" aria-hidden />
                  {module.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className={cn(modules.length > 0 && "border-t border-white/10 pt-2")}>
          <LogoutForm variant="sidebar" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
