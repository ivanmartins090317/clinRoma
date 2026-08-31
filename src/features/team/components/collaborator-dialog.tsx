"use client";

import { UserPlus } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteCollaboratorAction } from "@/features/team/actions";
import { TempPasswordPanel } from "@/features/team/components/temp-password-panel";
import { MANAGEABLE_ROLES } from "@/features/team/domain/team-guards";
import type { ProvisionMode } from "@/features/team/schemas";
import { getRoleLabel } from "@/lib/auth/role-labels";
import type { UserRole } from "@/types/clinroma";

const MODE_OPTIONS: Array<{ value: ProvisionMode; label: string; hint: string }> =
  [
    {
      value: "invite_email",
      label: "Convite por e-mail",
      hint: "O colaborador recebe um link e define a própria senha.",
    },
    {
      value: "temp_password",
      label: "Senha temporária",
      hint: "A senha aparece na tela uma única vez para você entregar.",
    },
  ];

export function CollaboratorDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("reception");
  const [mode, setMode] = useState<ProvisionMode>("invite_email");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    tempPassword?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setDisplayName("");
    setEmail("");
    setRole("reception");
    setMode("invite_email");
    setError(null);
    setResult(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
      router.refresh();
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const response = await inviteCollaboratorAction({
        displayName,
        email,
        role,
        mode,
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      setResult({
        message: response.message ?? "Acesso criado.",
        tempPassword: response.tempPassword,
      });
      router.refresh();
    });
  }

  const selectedMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="min-h-11">
          <UserPlus className="size-4" aria-hidden />
          Novo colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
          <DialogDescription>
            Cria o acesso ao ClinRoma e define o papel na clínica.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3.5">
            <p className="text-[14.5px] text-foreground">{result.message}</p>
            {result.tempPassword ? (
              <TempPasswordPanel password={result.tempPassword} />
            ) : null}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="collaborator-name">Nome</Label>
              <Input
                id="collaborator-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nome que aparece no sistema"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collaborator-email">E-mail</Label>
              <Input
                id="collaborator-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@clinica.com.br"
                autoComplete="off"
                inputMode="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collaborator-role">Papel</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger id="collaborator-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEABLE_ROLES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {getRoleLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collaborator-mode">Entrega do acesso</Label>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as ProvisionMode)}
              >
                <SelectTrigger id="collaborator-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMode ? (
                <p className="text-[12.5px] text-muted-foreground">
                  {selectedMode.hint}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-priority-red">{error}</p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => handleOpenChange(false)}
            >
              Concluir
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => handleOpenChange(false)}
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
                {isPending ? "Criando..." : "Criar acesso"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
