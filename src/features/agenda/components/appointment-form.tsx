"use client";

import { useRef, useState, useTransition } from "react";

import {
  createAppointmentAction,
  updateAppointmentAction,
} from "@/features/agenda/actions";
import {
  AppointmentNewPatientPanel,
  emptyNewPatientDraft,
  resolveNewConsultationSubmit,
  type NewPatientDraft,
} from "@/features/agenda/components/appointment-new-patient-panel";
import { createPatientAndAppointmentAction } from "@/features/agenda/create-patient-and-appointment";
import { OverlapConfirmDialog } from "@/features/agenda/components/overlap-confirm-dialog";
import type { OverlapPrompt } from "@/features/agenda/domain/appointment-conflict";
import {
  getAppointmentStatusLabel,
  WRITABLE_APPOINTMENT_STATUSES,
} from "@/features/agenda/domain/appointment-status";
import { nextAvailableClinicSlot } from "@/features/agenda/domain/appointment-time";
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

interface ExistingPatientChoice {
  id: string;
  name: string;
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

  const slot = nextAvailableClinicSlot(DEFAULT_APPOINTMENT_DURATION_MINUTES);
  const startTime = initialValues?.startTime ?? slot.startTime;

  return {
    patientId: initialValues?.patientId ?? "",
    patientName: initialValues?.patientName ?? "",
    dentistId: initialValues?.dentistId ?? dentists[0]?.id ?? "",
    date: initialValues?.date ?? slot.date,
    startTime,
    endTime: initialValues?.endTime ?? slot.endTime,
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
  const [draft, setDraft] = useState<NewPatientDraft>(() =>
    emptyNewPatientDraft(),
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [duplicatePatient, setDuplicatePatient] =
    useState<ExistingPatientChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overlap, setOverlap] = useState<OverlapPrompt | null>(null);
  const [overlapOpen, setOverlapOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveLockRef = useRef(false);
  const isEditing = Boolean(appointment);
  const registersTogether =
    resolveNewConsultationSubmit({
      isEditing,
      panelOpen,
      patientId: form.patientId,
    }) === "patient-and-appointment";

  function resetForm() {
    setForm(buildInitialState(dentists, appointment, initialValues));
    setDraft(emptyNewPatientDraft());
    setPanelOpen(false);
    setDuplicatePatient(null);
    setError(null);
    setOverlap(null);
    setOverlapOpen(false);
  }

  function returnToSearch() {
    setPanelOpen(false);
    setDraft(emptyNewPatientDraft());
    setDuplicatePatient(null);
    setError(null);
  }

  function adoptCreatedPatient(patientId: string, patientName: string) {
    setForm((current) => ({
      ...current,
      patientId,
      patientName,
    }));
    setPanelOpen(false);
    setDraft(emptyNewPatientDraft());
    setDuplicatePatient(null);
  }

  function useDuplicatePatient() {
    if (!duplicatePatient) {
      return;
    }

    adoptCreatedPatient(duplicatePatient.id, duplicatePatient.name);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(partnerId?: string): Promise<void> {
    if (saveLockRef.current) {
      return Promise.resolve();
    }

    saveLockRef.current = true;
    setError(null);
    setDuplicatePatient(null);

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const kind = resolveNewConsultationSubmit({
            isEditing,
            panelOpen,
            patientId: form.patientId,
          });

          if (kind === "patient-and-appointment") {
            const result = await createPatientAndAppointmentAction({
              patient: draft,
              appointment: {
                dentistId: form.dentistId,
                date: form.date,
                startTime: form.startTime,
                endTime: form.endTime,
                status: form.status,
                procedureName: form.procedureName || undefined,
                notes: form.notes || undefined,
              },
            });

            if (result.existingPatientId) {
              setDuplicatePatient({
                id: result.existingPatientId,
                name: result.existingPatientName ?? "paciente já cadastrado",
              });
              setError(result.error ?? "CPF já cadastrado.");
              return;
            }

            if (result.patientId && !result.success) {
              adoptCreatedPatient(
                result.patientId,
                result.patientName ?? draft.fullName.trim(),
              );

              if (result.overlap) {
                setOverlap(result.overlap);
                setOverlapOpen(true);
                return;
              }

              setOverlapOpen(false);
              setError(result.error ?? "Não foi possível criar a consulta");
              return;
            }

            if (result.error || !result.success) {
              setError(result.error ?? "Não foi possível cadastrar e marcar");
              return;
            }

            setOverlapOpen(false);
            onSuccess();
            handleOpenChange(false);
            return;
          }

          const payload = {
            patientId: form.patientId,
            dentistId: form.dentistId,
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            status: form.status,
            procedureName: form.procedureName || undefined,
            notes: form.notes || undefined,
            pairConfirmation: partnerId ? { partnerId } : undefined,
          };

          const result = isEditing
            ? await updateAppointmentAction({ ...payload, id: appointment!.id })
            : await createAppointmentAction(payload);

          if (result.overlap) {
            setOverlap(result.overlap);
            setOverlapOpen(true);
            return;
          }

          if (result.error) {
            setOverlapOpen(false);
            setError(result.error);
            return;
          }

          setOverlapOpen(false);
          onSuccess();
          handleOpenChange(false);
        } catch (submitError) {
          setError(
            submitError instanceof Error
              ? submitError.message
              : "Não foi possível cadastrar e marcar",
          );
        } finally {
          saveLockRef.current = false;
          resolve();
        }
      });
    });
  }

  return (
    <>
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
              disabled={isPending}
              onCreatePatient={
                isEditing
                  ? undefined
                  : (name) => {
                      setDraft((current) =>
                        panelOpen
                          ? { ...current, fullName: name }
                          : emptyNewPatientDraft(name),
                      );
                      setPanelOpen(true);
                      setError(null);
                      setDuplicatePatient(null);
                    }
              }
              onSelect={(patient) => {
                setForm((current) => ({
                  ...current,
                  patientId: patient.id,
                  patientName: patient.fullName,
                }));
                setPanelOpen(false);
                setDraft(emptyNewPatientDraft());
                setDuplicatePatient(null);
                setError(null);
              }}
            />

            {!isEditing && panelOpen ? (
              <AppointmentNewPatientPanel
                draft={draft}
                onDraftChange={setDraft}
                onUseRegisteredPatient={returnToSearch}
                disabled={isPending}
              />
            ) : null}

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
                  min={isEditing ? undefined : nextAvailableClinicSlot().date}
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
                      {getAppointmentStatusLabel(status)}
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

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {duplicatePatient ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 whitespace-normal"
                disabled={isPending}
                onClick={useDuplicatePatient}
              >
                Usar {duplicatePatient.name}
              </Button>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11"
              onClick={() => handleSubmit()}
              disabled={isPending}
            >
              {isPending
                ? "Salvando..."
                : registersTogether
                  ? "Cadastrar e marcar"
                  : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OverlapConfirmDialog
        prompt={overlap}
        open={overlapOpen}
        onOpenChange={setOverlapOpen}
        onConfirm={() => handleSubmit(overlap?.partnerId)}
      />
    </>
  );
}
