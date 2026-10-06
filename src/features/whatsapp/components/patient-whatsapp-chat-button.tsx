"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { PATIENT_WHATSAPP_CHAT_COPY } from "@/features/whatsapp/domain/chat-link";
import { openPatientWhatsAppChatAction } from "@/features/whatsapp/open-patient-chat-action";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const PatientWhatsAppChatAccessContext = createContext(false);

export function PatientWhatsAppChatAccess({
  canOpen,
  children,
}: {
  canOpen: boolean;
  children: ReactNode;
}) {
  return (
    <PatientWhatsAppChatAccessContext.Provider value={canOpen}>
      {children}
    </PatientWhatsAppChatAccessContext.Provider>
  );
}

export function useCanOpenPatientWhatsAppChat(): boolean {
  return useContext(PatientWhatsAppChatAccessContext);
}

interface PatientWhatsAppChatButtonProps {
  patientId: string;
  canOpen: boolean;
  className?: string;
}

function takeChatWindow(): Window | null {
  const popup = window.open("about:blank", "_blank");
  if (!popup) return null;
  popup.opener = null;
  return popup;
}

function showChat(popup: Window | null, url: string): boolean {
  if (popup && !popup.closed) {
    popup.location.replace(url);
    return true;
  }

  return window.open(url, "_blank", "noopener,noreferrer") !== null;
}

function closeChatWindow(popup: Window | null) {
  if (popup && !popup.closed) popup.close();
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="text-[#25D366]"
    >
      <path
        fill="currentColor"
        d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.34-1.66a11.9 11.9 0 0 0 5.72 1.46h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.44-8.42ZM12.07 21.82h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.99 1-3.67-.23-.38a9.86 9.86 0 0 1-1.51-5.27c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.98c-.01 5.45-4.45 9.89-9.87 9.92Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.04-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.34Z"
      />
    </svg>
  );
}

export function PatientWhatsAppChatButton({
  patientId,
  canOpen,
  className,
}: PatientWhatsAppChatButtonProps) {
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);

  if (!canOpen) return null;

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (inFlight.current) return;

    inFlight.current = true;
    setIsPending(true);
    const popup = takeChatWindow();

    try {
      const result = await openPatientWhatsAppChatAction({ patientId });
      if ("error" in result) {
        closeChatWindow(popup);
        toast(result.error);
        return;
      }

      if (result.notice) toast(result.notice);
      if (!showChat(popup, result.url)) {
        closeChatWindow(popup);
        toast(PATIENT_WHATSAPP_CHAT_COPY.popupBlocked);
      }
    } catch {
      closeChatWindow(popup);
      toast(PATIENT_WHATSAPP_CHAT_COPY.channelUnavailable);
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("min-h-11", className)}
      disabled={isPending}
      aria-busy={isPending}
      onClick={(event) => {
        void handleClick(event);
      }}
    >
      <WhatsAppIcon />
      {PATIENT_WHATSAPP_CHAT_COPY.button}
    </Button>
  );
}
