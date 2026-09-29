"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const AVISO_BLOCO_FALHOU = "Não foi possível carregar agora.";

export const ATRASO_ENTRE_BLOCOS_MS = 50;

export function atrasosDaLeva(ordens: readonly number[]): number[] {
  const posicoes = ordens.map((ordem, index) => ({ ordem, index }));
  posicoes.sort((esquerda, direita) => esquerda.ordem - direita.ordem);

  const atrasos = new Array<number>(ordens.length).fill(0);
  posicoes.forEach((item, posicao) => {
    atrasos[item.index] = posicao * ATRASO_ENTRE_BLOCOS_MS;
  });

  return atrasos;
}

interface EntradaLeva {
  ordem: number;
  node: HTMLElement;
}

let leva: EntradaLeva[] = [];
let flushAgendado = false;

function flushLeva() {
  flushAgendado = false;
  if (leva.length === 0) return;

  const grupo = leva;
  leva = [];
  const atrasos = atrasosDaLeva(grupo.map((entrada) => entrada.ordem));

  grupo.forEach((entrada, indice) => {
    entrada.node.style.animationDelay = `${atrasos[indice]}ms`;
    entrada.node.classList.add("is-entrando");
  });
}

function agendarFlush() {
  if (flushAgendado) return;
  flushAgendado = true;
  queueMicrotask(flushLeva);
}

const caixaHoje =
  "rounded-(--radius) border border-[#f0e3db] bg-neo-white shadow-neo";

interface LugarProps {
  variante: "numeros" | "cartao";
}

export function LugarReservado({ variante }: LugarProps) {
  if (variante === "numeros") {
    return (
      <div
        aria-hidden
        className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3"
      >
        {["consultas", "fila", "ofertas", "estoque"].map((id) => (
          <div key={id} className={cn("min-h-25 md:min-h-27", caixaHoje)} />
        ))}
      </div>
    );
  }

  return <div aria-hidden className={cn("min-h-34", caixaHoje)} />;
}

export function LugarFalha({ variante }: LugarProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center px-5",
        variante === "numeros" ? "min-h-25 md:min-h-27" : "min-h-34",
        caixaHoje,
      )}
    >
      <p className="text-sm font-medium text-foreground">
        {AVISO_BLOCO_FALHOU}
      </p>
    </div>
  );
}

interface BlocoEntradaProps {
  ordem: number;
  children: ReactNode;
}

export function BlocoEntrada({ ordem, children }: BlocoEntradaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const entrada: EntradaLeva = { ordem, node };
    leva.push(entrada);
    agendarFlush();

    return () => {
      const index = leva.indexOf(entrada);
      if (index >= 0) {
        leva.splice(index, 1);
      }
    };
  }, [ordem]);

  return (
    <div ref={ref} className="hoje-bloco">
      {children}
    </div>
  );
}
