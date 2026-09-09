"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateCollaboratorProfileAction,
  updateDentistCardAction,
} from "@/features/team/actions";
import type { CollaboratorListItem } from "@/features/team/queries";

interface EditCollaboratorDialogProps {
  collaborator: CollaboratorListItem;
  onFeedback: (feedback: { message?: string; error?: string }) => void;
}

export function EditCollaboratorDialog({
  collaborator,
  onFeedback,
}: EditCollaboratorDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(collaborator.displayName);
  const [email, setEmail] = useState(collaborator.email ?? "");
  const [fullName, setFullName] = useState(
    collaborator.dentistCard?.fullName ?? "",
  );
  const [cro, setCro] = useState(collaborator.dentistCard?.cro ?? "");
  const [calendarColor, setCalendarColor] = useState(
    collaborator.dentistCard?.calendarColor ?? "#6B2737",
  );
  const [agendaActive, setAgendaActive] = useState(
    collaborator.dentistCard?.active ?? true,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasDentistCard = collaborator.dentistCard !== null;

  function syncFromCollaborator() {
    setDisplayName(collaborator.displayName);
    setEmail(collaborator.email ?? "");
    setFullName(collaborator.dentistCard?.fullName ?? "");
    setCro(collaborator.dentistCard?.cro ?? "");
    setCalendarColor(collaborator.dentistCard?.calendarColor ?? "#6B2737");
    setAgendaActive(collaborator.dentistCard?.active ?? true);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      syncFromCollaborator();
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const profileResult = await updateCollaboratorProfileAction({
        collaboratorId: collaborator.id,
        displayName,
        email,
      });

      if (profileResult.error) {
        setError(profileResult.error);
        onFeedback({ error: profileResult.error });
        return;
      }

      let message = profileResult.message;

      if (hasDentistCard) {
        const cardResult = await updateDentistCardAction({
          collaboratorId: collaborator.id,
          fullName,
          cro,
          calendarColor,
          active: agendaActive,
        });

        if (cardResult.error) {
          setError(cardResult.error);
          onFeedback({ error: cardResult.error });
          return;
        }

        message = cardResult.message ?? message;
      }

      onFeedback({ message });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11">
          <Pencil className="size-4" aria-hidden />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar colaborador</DialogTitle>
          <DialogDescription>
            Atualiza nome de exibição, e-mail de login
            {hasDentistCard ? " e ficha de agenda" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-name-${collaborator.id}`}>
              Nome de exibição
            </Label>
            <Input
              id={`edit-name-${collaborator.id}`}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-email-${collaborator.id}`}>E-mail</Label>
            <Input
              id={`edit-email-${collaborator.id}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              inputMode="email"
            />
          </div>

          {hasDentistCard ? (
            <fieldset className="space-y-3.5 rounded-(--radius) border border-[#f0e3db] p-3.5">
              <legend className="px-1 text-[13px] font-medium text-foreground">
                Agenda
              </legend>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-clinical-${collaborator.id}`}>
                  Nome clínico
                </Label>
                <Input
                  id={`edit-clinical-${collaborator.id}`}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-cro-${collaborator.id}`}>CRO</Label>
                <Input
                  id={`edit-cro-${collaborator.id}`}
                  value={cro}
                  onChange={(event) => setCro(event.target.value)}
                  placeholder="Opcional"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-color-${collaborator.id}`}>
                  Cor na agenda
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`edit-color-${collaborator.id}`}
                    type="color"
                    value={calendarColor}
                    onChange={(event) => setCalendarColor(event.target.value)}
                    className="h-11 w-14 cursor-pointer p-1"
                    aria-label="Seletor de cor"
                  />
                  <Input
                    value={calendarColor}
                    onChange={(event) => setCalendarColor(event.target.value)}
                    placeholder="#6B2737"
                    autoComplete="off"
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={agendaActive}
                  onChange={(event) => setAgendaActive(event.target.checked)}
                  className="size-4 accent-primary"
                />
                Ativo na agenda
              </label>
            </fieldset>
          ) : null}

          {error ? <p className="text-sm text-priority-red">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="min-h-11"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
