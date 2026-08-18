"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastMessage {
  id: number;
  text: string;
}

let pushToast: ((text: string) => void) | null = null;

export function toast(text: string) {
  pushToast?.(text);
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    pushToast = (text: string) => {
      const id = Date.now();
      setMessages((current) => [...current, { id, text }]);
      window.setTimeout(() => {
        setMessages((current) => current.filter((item) => item.id !== id));
      }, 3500);
    };

    return () => {
      pushToast = null;
    };
  }, []);

  if (typeof document === "undefined" || messages.length === 0) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className="rounded-lg border border-border bg-background px-4 py-3 text-sm shadow-lg"
        >
          {message.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
