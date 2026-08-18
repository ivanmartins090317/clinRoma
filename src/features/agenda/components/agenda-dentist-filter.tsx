"use client";

import Link from "next/link";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgendaDentist } from "@/features/agenda/types";

interface AgendaDentistFilterProps {
  dentists: AgendaDentist[];
  selectedDate: string;
  value: string;
}

function buildHref(date: string, dentistId: string): string {
  const params = new URLSearchParams({ date });

  if (dentistId !== "all") {
    params.set("dentist", dentistId);
  }

  return `/agenda?${params.toString()}`;
}

export function AgendaDentistFilter({
  dentists,
  selectedDate,
  value,
}: AgendaDentistFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(dentistId) => {
        window.location.href = buildHref(selectedDate, dentistId);
      }}
    >
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue placeholder="Filtrar dentista" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os dentistas</SelectItem>
        {dentists.map((dentist) => (
          <SelectItem key={dentist.id} value={dentist.id}>
            {dentist.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AgendaDentistFilterLinks({
  dentists,
  selectedDate,
  value,
}: AgendaDentistFilterProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href={buildHref(selectedDate, "all")}
        className={
          value === "all"
            ? "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            : "rounded-full border border-border px-3 py-1.5 text-sm"
        }
      >
        Todos
      </Link>
      {dentists.map((dentist) => (
        <Link
          key={dentist.id}
          href={buildHref(selectedDate, dentist.id)}
          className={
            value === dentist.id
              ? "rounded-full px-3 py-1.5 text-sm text-white"
              : "rounded-full border border-border px-3 py-1.5 text-sm"
          }
          style={
            value === dentist.id
              ? { backgroundColor: dentist.calendarColor }
              : undefined
          }
        >
          {dentist.fullName}
        </Link>
      ))}
    </nav>
  );
}
