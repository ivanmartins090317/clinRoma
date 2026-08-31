"use client";

import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeRoleAction,
  resendInviteAction,
  setActiveAction,
} from "@/features/team/actions";
import { MANAGEABLE_ROLES } from "@/features/team/domain/team-guards";
import type { CollaboratorListItem } from "@/features/team/queries";
import { getRoleLabel } from "@/lib/auth/role-labels";
import type { UserRole } from "@/types/clinroma";

interface CollaboratorRowProps {
  collaborator: CollaboratorListItem;
  isCurrentUser: boolean;
  onFeedback: (feedback: { message?: string; error?: string }) => void;
}

function formatLastAccess(value: string | null): string {
  if (!value) {
    return "Nunca acessou";
  }

  return `Último acesso ${new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
}

export function CollaboratorRow({
  collaborator,
  isCurrentUser,
  onFeedback,
}: CollaboratorRowProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(collaborator.role);
  const [isPending, startTransition] = useTransition();

  function runAction(
    action: () => Promise<{ message?: string; error?: string }>,
    onError?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();

      if (result.error) {
        onError?.();
        onFeedback({ error: result.error });
        return;
      }

      onFeedback({ message: result.message });
      router.refresh();
    });
  }

  function handleRoleChange(value: string) {
    const nextRole = value as UserRole;
    const previousRole = role;
    setRole(nextRole);

    runAction(
      () =>
        changeRoleAction({
          collaboratorId: collaborator.id,
          role: nextRole,
        }),
      () => setRole(previousRole),
    );
  }

  function handleToggleActive() {
    runAction(() =>
      setActiveAction({
        collaboratorId: collaborator.id,
        active: !collaborator.active,
      }),
    );
  }

  function handleResendInvite() {
    runAction(() => resendInviteAction({ collaboratorId: collaborator.id }));
  }

  return (
    <li className="flex flex-col gap-3 border-b border-neo-cream-line px-4 py-3.5 last:border-b-0 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {collaborator.displayName}
          </p>
          {isCurrentUser ? <Badge variant="outline">Você</Badge> : null}
          {collaborator.active ? (
            <Badge variant="success" dot>
              Ativo
            </Badge>
          ) : (
            <Badge variant="destructive" dot>
              Inativo
            </Badge>
          )}
        </div>
        <p className="truncate text-[13px] text-muted-foreground">
          {collaborator.email ?? "E-mail não encontrado"}
        </p>
        <p className="text-[12.5px] text-muted-foreground">
          {formatLastAccess(collaborator.lastSignInAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {isCurrentUser ? (
          <p className="text-[13px] text-muted-foreground">
            {getRoleLabel(collaborator.role)} · seu próprio acesso não é
            editável
          </p>
        ) : (
          <>
            <Select
              value={role}
              onValueChange={handleRoleChange}
              disabled={isPending}
            >
              <SelectTrigger
                aria-label={`Papel de ${collaborator.displayName}`}
                className="w-full md:w-46"
              >
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

            {collaborator.email ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={handleResendInvite}
                disabled={isPending}
                title="Reenviar link de definição de senha"
              >
                <MailCheck className="size-4" aria-hidden />
                Reenviar convite
              </Button>
            ) : null}

            <Button
              type="button"
              variant={collaborator.active ? "dangerGhost" : "outline"}
              className="min-h-11"
              onClick={handleToggleActive}
              disabled={isPending}
            >
              {collaborator.active ? "Desativar" : "Reativar"}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
