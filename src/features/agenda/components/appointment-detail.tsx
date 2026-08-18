"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { cancelAppointmentAction } from "@/features/agenda/actions";
import { getAppointmentStatusLabel } from "@/features/agenda/domain/appointment-status";
import {
  formatClinicDateTime,
  formatClinicTime,
  type AgendaAppointment,
} from "@/features/agenda/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentDetailProps {
  appointment: AgendaAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  onEdit: (appointment: AgendaAppointment) => void;
  onCancelled: () => void;
}

export function AppointmentDetail({
  appointment,
  open,
  onOpenChange,
  canWrite,
  onEdit,
  onCancelled,
}: AppointmentDetailProps) {
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!appointment) {
    return null;
  }

  function handleCancel() {
    setError(null);

    startTransition(async () => {
      const result = await cancelAppointmentAction({ id: appointment!.id });

      if (result.error) {
        setError(result.error);
        return;
      }

      setConfirmCancel(false);
      onCancelled();
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setConfirmCancel(false);
          setError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{appointment.patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {getAppointmentStatusLabel(appointment.status)}
            </Badge>
          </div>
          <p>
            <span className="font-medium">Dentista:</span>{" "}
            {appointment.dentistName}
          </p>
          <p>
            <span className="font-medium">Horário:</span>{" "}
            {formatClinicDateTime(appointment.startsAt)} ·{" "}
            {formatClinicTime(appointment.endsAt)}
          </p>
          {appointment.procedureName ? (
            <p>
              <span className="font-medium">Procedimento:</span>{" "}
              {appointment.procedureName}
            </p>
          ) : null}
          {appointment.notes ? (
            <p>
              <span className="font-medium">Observação:</span>{" "}
              {appointment.notes}
            </p>
          ) : null}
          <Link
            href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Abrir prontuário
          </Link>
        </div>

        {confirmCancel ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p>
              Cancelar consulta de {appointment.patientName}? O horário ficará
              livre na agenda.
            </p>
            {error ? <p className="mt-2 text-destructive">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmCancel(false)}
                disabled={isPending}
              >
                Voltar
              </Button>
              <Button
                variant="default"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleCancel}
                disabled={isPending}
              >
                {isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            {canWrite ? (
              <>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancelar consulta
                </Button>
                <Button onClick={() => onEdit(appointment)}>Editar</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
