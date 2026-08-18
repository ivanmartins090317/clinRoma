"use client";

import { useState, useTransition } from "react";

import {
  createAppointmentAction,
  updateAppointmentAction,
} from "@/features/agenda/actions";
import { WRITABLE_APPOINTMENT_STATUSES } from "@/features/agenda/domain/appointment-status";
import { PatientCombobox } from "@/features/agenda/components/patient-combobox";
import {
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  splitClinicDateTime,
  type AgendaAppointment,
  type AgendaDentist,
} from "@/features/agenda/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppointmentStatus } from "@/types/clinroma";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dentists: AgendaDentist[];
  appointment?: AgendaAppointment | null;
  initialValues?: Partial<FormState>;
  onSuccess: () => void;
}

interface FormState {
  patientId: string;
  patientName: string;
  dentistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  procedureName: string;
  notes: string;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMins = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}

function buildInitialState(
  dentists: AgendaDentist[],
  appointment?: AgendaAppointment | null,
  initialValues?: Partial<FormState>,
): FormState {
  if (appointment) {
    const { date, time } = splitClinicDateTime(appointment.startsAt);
    const end = splitClinicDateTime(appointment.endsAt).time;

    return {
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      dentistId: appointment.dentistId,
      date,
      startTime: time,
      endTime: end,
      status: appointment.status,
      procedureName: appointment.procedureName ?? "",
      notes: appointment.notes ?? "",
    };
  }

  const startTime = initialValues?.startTime ?? "09:00";

  return {
    patientId: initialValues?.patientId ?? "",
    patientName: initialValues?.patientName ?? "",
    dentistId: initialValues?.dentistId ?? dentists[0]?.id ?? "",
    date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
    startTime,
    endTime:
      initialValues?.endTime ??
      addMinutesToTime(startTime, DEFAULT_APPOINTMENT_DURATION_MINUTES),
    status: initialValues?.status ?? "scheduled",
    procedureName: initialValues?.procedureName ?? "",
    notes: initialValues?.notes ?? "",
  };
}

export function AppointmentForm({
  open,
  onOpenChange,
  dentists,
  appointment,
  initialValues,
  onSuccess,
}: AppointmentFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(dentists, appointment, initialValues),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(appointment);

  function resetForm() {
    setForm(buildInitialState(dentists, appointment, initialValues));
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const payload = {
        patientId: form.patientId,
        dentistId: form.dentistId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        status: form.status,
        procedureName: form.procedureName || undefined,
        notes: form.notes || undefined,
      };

      const result = isEditing
        ? await updateAppointmentAction({ ...payload, id: appointment!.id })
        : await createAppointmentAction(payload);

      if (result.error) {
        setError(result.error);
        return;
      }

      onSuccess();
      handleOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar consulta" : "Nova consulta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PatientCombobox
            key={`${form.patientId}-${form.patientName}`}
            value={form.patientId}
            selectedLabel={form.patientName}
            onSelect={(patient) => {
              setForm((current) => ({
                ...current,
                patientId: patient.id,
                patientName: patient.fullName,
              }));
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="dentist">Dentista</Label>
            <Select
              value={form.dentistId}
              onValueChange={(dentistId) =>
                setForm((current) => ({ ...current, dentistId }))
              }
            >
              <SelectTrigger id="dentist">
                <SelectValue placeholder="Selecione o dentista" />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id}>
                    {dentist.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Início</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fim</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Situação</Label>
            <Select
              value={form.status}
              onValueChange={(status) =>
                setForm((current) => ({
                  ...current,
                  status: status as AppointmentStatus,
                }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WRITABLE_APPOINTMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "scheduled" ? "Agendado" : "Confirmado"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedure">Procedimento</Label>
            <Input
              id="procedure"
              value={form.procedureName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  procedureName: event.target.value,
                }))
              }
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observação</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Opcional"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
