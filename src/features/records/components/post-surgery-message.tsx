"use client";

import { useState, useTransition } from "react";

import {
  cancelPostSurgeryWhatsAppAction,
  schedulePostSurgeryWhatsAppAction,
  sendPostSurgeryWhatsAppAction,
} from "@/features/records/whatsapp-actions";
import {
  PATIENT_MESSAGE_BODY_MAX,
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_STATUS,
  validatePostSurgeryBody,
} from "@/features/records/domain/patient-message";
import { validateScheduleInput } from "@/features/records/domain/post-surgery-schedule";
import type {
  PostSurgeryMessageView,
  WhatsAppDestinationView,
} from "@/features/records/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PostSurgeryMessageProps {
  patientId: string;
  appointmentId?: string;
  canSend: boolean;
  channelConfigured: boolean;
  destination: WhatsAppDestinationView;
  messages: PostSurgeryMessageView[];
}

export function PostSurgeryMessage({
  patientId,
  appointmentId,
  canSend,
  channelConfigured,
  destination,
  messages,
}: PostSurgeryMessageProps) {
  const [body, setBody] = useState("");
  const [datetimeLocal, setDatetimeLocal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasDestination = destination.hasDestination;
  const canSchedule = canSend && hasDestination && !isPending;
  const canSendNow = canSchedule && channelConfigured;

  function resetAlerts() {
    setError(null);
    setSuccess(null);
  }

  function schedule() {
    resetAlerts();
    const bodyError = validatePostSurgeryBody(body);
    if (bodyError) {
      setError(bodyError);
      return;
    }
    const scheduleError = validateScheduleInput(datetimeLocal);
    if ("error" in scheduleError) {
      setError(scheduleError.error);
      return;
    }

    startTransition(async () => {
      const result = await schedulePostSurgeryWhatsAppAction({
        patientId,
        appointmentId,
        body,
        datetimeLocal,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(PATIENT_MESSAGE_COPY.successScheduled);
      setBody("");
      setDatetimeLocal("");
    });
  }

  function sendNow() {
    resetAlerts();
    const bodyError = validatePostSurgeryBody(body);
    if (bodyError) {
      setError(bodyError);
      return;
    }

    startTransition(async () => {
      const result = await sendPostSurgeryWhatsAppAction({
        patientId,
        appointmentId,
        body,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(PATIENT_MESSAGE_COPY.success);
      setBody("");
    });
  }

  function cancel(messageId: string) {
    resetAlerts();
    startTransition(async () => {
      const result = await cancelPostSurgeryWhatsAppAction({
        messageId,
        patientId,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(PATIENT_MESSAGE_COPY.successCancelled);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Label htmlFor="post-surgery-body">
          {PATIENT_MESSAGE_COPY.composer}
        </Label>
        <Textarea
          id="post-surgery-body"
          value={body}
          maxLength={PATIENT_MESSAGE_BODY_MAX}
          disabled={!canSend || isPending}
          onChange={(event) => {
            setBody(event.target.value);
            setSuccess(null);
          }}
          className="min-h-32"
        />
        <div className="space-y-2">
          <Label htmlFor="post-surgery-schedule">
            {PATIENT_MESSAGE_COPY.scheduleAt}
          </Label>
          <Input
            id="post-surgery-schedule"
            type="datetime-local"
            value={datetimeLocal}
            disabled={!canSend || isPending}
            onChange={(event) => {
              setDatetimeLocal(event.target.value);
              setSuccess(null);
            }}
            className="min-h-11"
          />
          <p className="text-sm text-muted-foreground">
            {PATIENT_MESSAGE_COPY.scheduleHelp}
          </p>
        </div>
        {hasDestination ? (
          <p className="text-sm text-muted-foreground">{destination.notice}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {PATIENT_MESSAGE_COPY.noDestination}
          </p>
        )}
        {!channelConfigured ? (
          <p className="text-sm text-muted-foreground">
            {PATIENT_MESSAGE_COPY.channelUnavailable}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            disabled={!canSchedule}
            onClick={schedule}
            className="min-h-11"
          >
            {PATIENT_MESSAGE_COPY.schedule}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canSendNow}
            onClick={sendNow}
            className="min-h-11"
          >
            {PATIENT_MESSAGE_COPY.sendNow}
          </Button>
        </div>
        {success ? <p className="text-sm text-foreground">{success}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>

      <PostSurgeryMessageList
        messages={messages}
        canSend={canSend}
        isPending={isPending}
        onCancel={cancel}
      />
    </div>
  );
}

function PostSurgeryMessageList({
  messages,
  canSend,
  isPending,
  onCancel,
}: {
  messages: PostSurgeryMessageView[];
  canSend: boolean;
  isPending: boolean;
  onCancel: (messageId: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {PATIENT_MESSAGE_COPY.emptyList}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <li
          key={message.id}
          className="space-y-2 rounded-xl border border-border bg-background p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {new Date(message.createdAt).toLocaleString("pt-BR")}
              {message.authorName ? ` · ${message.authorName}` : ""}
            </p>
            <p
              className={
                message.status === PATIENT_MESSAGE_STATUS.failed
                  ? "text-sm font-medium text-destructive"
                  : "text-sm font-medium"
              }
            >
              {message.statusLabel}
            </p>
          </div>
          {message.scheduledLabel ? (
            <p className="text-sm text-muted-foreground">
              {message.status === PATIENT_MESSAGE_STATUS.pending
                ? `Para ${message.scheduledLabel}`
                : `Horário ${message.scheduledLabel}`}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {message.destinationLabel}
          </p>
          <p className="whitespace-pre-wrap text-sm">{message.body}</p>
          {canSend && message.canCancel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => onCancel(message.id)}
              className="min-h-11"
            >
              {PATIENT_MESSAGE_COPY.cancel}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
