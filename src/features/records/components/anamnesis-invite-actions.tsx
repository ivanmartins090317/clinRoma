"use client";

import { useState, useTransition } from "react";

import {
  generateAnamnesisInviteAction,
  sendAnamnesisInviteWhatsAppAction,
} from "@/features/records/actions";
import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";
import { PATIENT_MESSAGE_COPY } from "@/features/records/domain/patient-message";
import type { WhatsAppDestinationView } from "@/features/records/queries";
import { Button } from "@/components/ui/button";

interface AnamnesisInviteActionsProps {
  patientId: string;
  appointmentId?: string;
  channelConfigured: boolean;
  destination: WhatsAppDestinationView;
}

export function AnamnesisInviteActions({
  patientId,
  appointmentId,
  channelConfigured,
  destination,
}: AnamnesisInviteActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState<{
    url: string;
    purpose: "pre_consult" | "office";
    replaced: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSendWhatsApp =
    channelConfigured && destination.hasDestination && !isPending;

  function generate(
    purpose: "pre_consult" | "office",
    options?: { openAfter?: boolean },
  ) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await generateAnamnesisInviteAction({
        patientId,
        purpose,
      });

      if (result.error || !result.inviteUrl) {
        setError(result.error ?? ANAMNESIS_COPY.forbiddenInvite);
        return;
      }

      setCopied(false);
      setLink({
        url: result.inviteUrl,
        purpose,
        replaced: Boolean(result.replaced),
      });

      if (options?.openAfter) {
        const opened = window.open(
          result.inviteUrl,
          "_blank",
          "noopener,noreferrer",
        );
        if (!opened) {
          setError(
            "O navegador bloqueou a nova aba. Copie o link e abra no tablet.",
          );
        }
      }
    });
  }

  function sendWhatsApp() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await sendAnamnesisInviteWhatsAppAction({
        patientId,
        appointmentId,
      });

      if (result.inviteUrl) {
        setCopied(false);
        setLink({
          url: result.inviteUrl,
          purpose: "pre_consult",
          replaced: false,
        });
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(PATIENT_MESSAGE_COPY.successAnamnesis);
    });
  }

  async function copyLink() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => generate("pre_consult")}
          className="min-h-11"
        >
          {ANAMNESIS_COPY.generatePreConsult}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => generate("office", { openAfter: true })}
          className="min-h-11"
        >
          {ANAMNESIS_COPY.openTablet}
        </Button>
        <Button
          type="button"
          disabled={!canSendWhatsApp}
          onClick={sendWhatsApp}
          className="min-h-11"
        >
          {ANAMNESIS_COPY.sendWhatsApp}
        </Button>
      </div>
      {destination.hasDestination ? (
        <p className="text-sm text-muted-foreground">{destination.notice}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {PATIENT_MESSAGE_COPY.noDestination}
        </p>
      )}
      {!channelConfigured ? (
        <p className="text-sm text-muted-foreground">
          {PATIENT_MESSAGE_COPY.channelUnavailableInvite}
        </p>
      ) : null}
      {link ? (
        <div className="space-y-2">
          {link.replaced ? (
            <p className="text-sm text-muted-foreground">
              {ANAMNESIS_COPY.linkReplaced}
            </p>
          ) : null}
          <p className="break-all text-sm text-muted-foreground">{link.url}</p>
          <Button type="button" onClick={copyLink} className="min-h-11">
            {copied ? "Link copiado" : "Copiar link"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {link.purpose === "office"
              ? ANAMNESIS_COPY.helpTablet
              : ANAMNESIS_COPY.helpPreConsult}
          </p>
        </div>
      ) : null}
      {success ? <p className="text-sm text-foreground">{success}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
