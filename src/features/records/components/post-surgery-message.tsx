"use client";

import { useState, useTransition } from "react";

import { sendPostSurgeryWhatsAppAction } from "@/features/records/actions";
import {
  PATIENT_MESSAGE_BODY_MAX,
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_STATUS,
  validatePostSurgeryBody,
} from "@/features/records/domain/patient-message";
import type {
  PostSurgeryMessageView,
  WhatsAppDestinationView,
} from "@/features/records/queries";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    canSend && channelConfigured && destination.hasDestination && !isPending;

  function send() {
    setError(null);
    setSuccess(null);

    const validationError = validatePostSurgeryBody(body);
    if (validationError) {
      setError(validationError);
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
        {destination.hasDestination ? (
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
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={send}
          className="min-h-11"
        >
          {PATIENT_MESSAGE_COPY.send}
        </Button>
        {success ? <p className="text-sm text-foreground">{success}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>

      <PostSurgeryMessageList messages={messages} />
    </div>
  );
}

function PostSurgeryMessageList({
  messages,
}: {
  messages: PostSurgeryMessageView[];
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
                message.status === PATIENT_MESSAGE_STATUS.sent
                  ? "text-sm font-medium"
                  : "text-sm font-medium text-destructive"
              }
            >
              {message.statusLabel}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {message.destinationLabel}
          </p>
          <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        </li>
      ))}
    </ul>
  );
}
