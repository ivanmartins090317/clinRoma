"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildAgendaHref } from "@/features/agenda/domain/agenda-range";
import { cn } from "@/lib/utils";

interface AgendaDateNavProps {
  previousDate: string;
  currentDate: string;
  nextDate: string;
  dentistFilter: string;
  todayDate: string;
  className?: string;
}

function buildHref(date: string, dentistFilter: string): string {
  return buildAgendaHref({ date, dentistId: dentistFilter });
}

export function AgendaDateNav({
  previousDate,
  currentDate,
  nextDate,
  dentistFilter,
  todayDate,
  className,
}: AgendaDateNavProps) {
  const [year, month, day] = currentDate.split("-");
  const formatted = `${day}/${month}/${year}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="icon" asChild>
        <Link
          href={buildHref(previousDate, dentistFilter)}
          aria-label="Dia anterior"
        >
          <ChevronLeftIcon />
        </Link>
      </Button>

      <div className="min-w-[8.5rem] text-center text-sm font-medium">
        {formatted}
      </div>

      <Button variant="outline" size="icon" asChild>
        <Link
          href={buildHref(nextDate, dentistFilter)}
          aria-label="Próximo dia"
        >
          <ChevronRightIcon />
        </Link>
      </Button>

      <Button variant="secondary" size="sm" asChild>
        <Link href={buildHref(todayDate, dentistFilter)}>Hoje</Link>
      </Button>
    </div>
  );
}
