"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface TempPasswordPanelProps {
  password: string;
  message?: string | null;
}

export function TempPasswordPanel({
  password,
  message = null,
}: TempPasswordPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2.5 rounded-[10px] border border-[#e5c98d] bg-neo-gold-soft p-3.5">
      <p className="text-[13.5px] font-semibold text-[#6e4e0e]">
        {message ?? "Senha temporária gerada"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-[#e5c98d] bg-neo-white px-3 py-2 font-mono text-[15px] tracking-wide">
          {password}
        </code>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {copied ? "Copiada" : "Copiar"}
        </Button>
      </div>
      <p className="text-[12.5px] text-[#6e4e0e]">
        Esta senha aparece só agora. Entregue ao colaborador e peça a troca no
        primeiro acesso.
      </p>
    </div>
  );
}
