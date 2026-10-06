"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { cancelAppointmentAction } from "@/features/agenda/actions";
import { getAppointmentStatusLabel } from "@/features/agenda/domain/appointment-status";
import {
  formatClinicDateTime,
  formatClinicTime,
  type AgendaAppointment,
  type AgendaDentist,
} from "@/features/agenda/types";
import { PatientWhatsAppChatButton } from "@/features/whatsapp/components/patient-whatsapp-chat-button";
import { WaitlistOfferAfterCancel } from "@/features/waitlist/components/waitlist-offer-after-cancel";
import { ReminderStatusBadge } from "@/features/reminders/components/reminder-status-badge";
import type { ReminderSummary } from "@/features/reminders/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentDetailProps {
  appointment: AgendaAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  canOpenWhatsApp?: boolean;
  dentists: AgendaDentist[];
  reminder?: ReminderSummary | null;
  onEdit: (appointment: AgendaAppointment) => void;
  onCancelled: () => void;
}

export function AppointmentDetail({
  appointment,
  open,
  onOpenChange,
  canWrite,
  canOpenWhatsApp = false,
  dentists,
  reminder,
  onEdit,
  onCancelled,
}: AppointmentDetailProps) {
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelledAppointment, setCancelledAppointment] =
    useState<AgendaAppointment | null>(null);
  const [waitlistOfferOpen, setWaitlistOfferOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!appointment) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await cancelAppointmentAction({ id: appointment.id });

      if (result.error) {
        setError(result.error);
        return;
      }

      setConfirmCancel(false);
      setCancelledAppointment(appointment);
      onCancelled();
      onOpenChange(false);
      setWaitlistOfferOpen(true);
    });
  }

  if (!appointment && !cancelledAppointment) {
    return null;
  }

  return (
    <>
      {appointment ? (
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Badge variant="secondary">
                  {getAppointmentStatusLabel(appointment.status)}
                </Badge>
                {appointment.status === "completed" ? (
                  <ReminderStatusBadge reminder={reminder} />
                ) : null}
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
            </div>

            {confirmCancel ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p>
                  Cancelar consulta de {appointment.patientName}? O horário
                  ficará livre na agenda.
                </p>
                {error ? (
                  <p className="mt-2 text-destructive">{error}</p>
                ) : null}
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setConfirmCancel(false)}
                    disabled={isPending}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="default"
                    className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    {isPending ? "Cancelando..." : "Confirmar cancelamento"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  asChild
                  variant="secondary"
                  className={canOpenWhatsApp ? "w-full" : "w-full sm:col-span-2"}
                >
                  <Link
                    href={`/pacientes/${appointment.patientId}?consulta=${appointment.id}`}
                  >
                    Abrir prontuário
                  </Link>
                </Button>
                <PatientWhatsAppChatButton
                  patientId={appointment.patientId}
                  canOpen={canOpenWhatsApp}
                  className="w-full"
                />
                {canWrite ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full text-destructive"
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancelar consulta
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => onEdit(appointment)}
                    >
                      Editar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full sm:col-span-2"
                    onClick={() => onOpenChange(false)}
                  >
                    Fechar
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : null}

      {cancelledAppointment ? (
        <WaitlistOfferAfterCancel
          appointment={cancelledAppointment}
          dentists={dentists}
          open={waitlistOfferOpen}
          onOpenChange={setWaitlistOfferOpen}
          onDone={() => setCancelledAppointment(null)}
        />
      ) : null}
    </>
  );
}
