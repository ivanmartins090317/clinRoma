"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { searchPatientsAction } from "@/features/patients/actions";
import type { PatientListItem } from "@/features/patients/queries";
import { formatCpfDisplay } from "@/features/patients/domain/cpf";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PatientListProps {
  initialPatients: PatientListItem[];
  canCreate: boolean;
}

export function PatientList({ initialPatients, canCreate }: PatientListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState(initialPatients);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchPatientsAction(query);
        setPatients(results);
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou CPF"
          className="text-base"
          aria-label="Buscar pacientes"
        />
        {canCreate ? (
          <Link
            href="/pacientes/novo"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Novo paciente
          </Link>
        ) : null}
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Buscando...</p>
      ) : null}

      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum paciente encontrado
        </div>
      ) : (
        <ul className="space-y-2">
          {patients.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => router.push(`/pacientes/${patient.id}`)}
                className={cn(
                  "flex w-full min-h-11 flex-col items-start rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-neo-gold-500/40",
                )}
              >
                <span className="font-medium">{patient.fullName}</span>
                <span className="text-sm text-muted-foreground">
                  {patient.cpf
                    ? formatCpfDisplay(patient.cpf)
                    : "CPF não informado"}
                  {patient.contactPhone ? ` · ${patient.contactPhone}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
