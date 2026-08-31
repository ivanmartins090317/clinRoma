"use server";

import { revalidatePath } from "next/cache";

import {
  describeWriteFailure,
  refuseTeamMutation,
  TEAM_COPY,
} from "@/features/team/domain/team-guards";
import {
  deliverInvite,
  describeDeliveryFailure,
} from "@/features/team/lib/deliver-invite";
import { provisionCollaborator } from "@/features/team/lib/provision-collaborator";
import {
  logTeamAudit,
  requireTeamManager,
  TEAM_PATH,
  toActionError,
  type TeamActionResult,
} from "@/features/team/lib/team-action-context";
import {
  getCollaboratorEmail,
  getCollaboratorStates,
} from "@/features/team/queries";
import {
  changeRoleSchema,
  inviteCollaboratorSchema,
  resendInviteSchema,
  setActiveSchema,
} from "@/features/team/schemas";
import { createClient } from "@/lib/supabase/server";

export type { TeamActionResult };

/** Zero linhas afetadas depois das guardas de domínio significa barreira do banco. */
const RLS_HINT = "permission denied";

export async function inviteCollaboratorAction(
  input: unknown,
): Promise<TeamActionResult> {
  try {
    await requireTeamManager();
    const parsed = inviteCollaboratorSchema.safeParse(input);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { displayName, email, role, mode } = parsed.data;

    const provisioned = await provisionCollaborator({
      displayName,
      email,
      role,
    });

    if (!provisioned.ok) {
      return {
        error:
          provisioned.reason === "email_in_use"
            ? TEAM_COPY.emailInUse
            : TEAM_COPY.inviteFailed,
      };
    }

    await logTeamAudit("access_granted", provisioned.value.userId, {
      role,
      mode,
      origin: "equipe",
    });

    revalidatePath(TEAM_PATH);

    if (mode === "temp_password") {
      return {
        success: true,
        message: TEAM_COPY.tempPasswordReady,
        tempPassword: provisioned.value.tempPassword,
      };
    }

    const delivery = await deliverInvite({ email, displayName, role });

    if (!delivery.ok) {
      return {
        success: true,
        message: `${describeDeliveryFailure(delivery.reason)} Use a senha temporária abaixo.`,
        tempPassword: provisioned.value.tempPassword,
      };
    }

    return { success: true, message: TEAM_COPY.inviteSent };
  } catch (error) {
    return toActionError(error, TEAM_COPY.inviteFailed);
  }
}

export async function changeRoleAction(
  input: unknown,
): Promise<TeamActionResult> {
  try {
    const session = await requireTeamManager();
    const parsed = changeRoleSchema.safeParse(input);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const collaborators = await getCollaboratorStates();
    const previous = collaborators.find(
      (item) => item.id === parsed.data.collaboratorId,
    );

    const refusal = refuseTeamMutation(session.profile.role, collaborators, {
      actorId: session.profile.id,
      targetId: parsed.data.collaboratorId,
      nextRole: parsed.data.role,
    });

    if (refusal) {
      return { error: refusal };
    }

    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", parsed.data.collaboratorId)
      .select("id")
      .maybeSingle();

    // Update barrado por RLS não devolve erro, só zero linhas.
    if (error || !updated) {
      return { error: describeWriteFailure(error?.message ?? RLS_HINT) };
    }

    await logTeamAudit("role_changed", parsed.data.collaboratorId, {
      previousRole: previous?.role ?? null,
      nextRole: parsed.data.role,
      origin: "equipe",
    });

    revalidatePath(TEAM_PATH);

    return { success: true, message: TEAM_COPY.roleChanged };
  } catch (error) {
    return toActionError(error, "Não foi possível atualizar o papel");
  }
}

export async function setActiveAction(
  input: unknown,
): Promise<TeamActionResult> {
  try {
    const session = await requireTeamManager();
    const parsed = setActiveSchema.safeParse(input);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const collaborators = await getCollaboratorStates();

    const refusal = refuseTeamMutation(session.profile.role, collaborators, {
      actorId: session.profile.id,
      targetId: parsed.data.collaboratorId,
      nextActive: parsed.data.active,
    });

    if (refusal) {
      return { error: refusal };
    }

    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ active: parsed.data.active })
      .eq("id", parsed.data.collaboratorId)
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      return { error: describeWriteFailure(error?.message ?? RLS_HINT) };
    }

    await logTeamAudit(
      parsed.data.active ? "access_reactivated" : "access_deactivated",
      parsed.data.collaboratorId,
      { origin: "equipe" },
    );

    revalidatePath(TEAM_PATH);

    return {
      success: true,
      message: parsed.data.active
        ? TEAM_COPY.reactivated
        : TEAM_COPY.deactivated,
    };
  } catch (error) {
    return toActionError(error, "Não foi possível alterar o acesso");
  }
}

export async function resendInviteAction(
  input: unknown,
): Promise<TeamActionResult> {
  try {
    await requireTeamManager();
    const parsed = resendInviteSchema.safeParse(input);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const collaborators = await getCollaboratorStates();
    const target = collaborators.find(
      (item) => item.id === parsed.data.collaboratorId,
    );

    if (!target) {
      return { error: TEAM_COPY.targetNotFound };
    }

    const email = await getCollaboratorEmail(parsed.data.collaboratorId);

    if (!email) {
      return { error: "Colaborador sem e-mail cadastrado." };
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", parsed.data.collaboratorId)
      .maybeSingle();

    const delivery = await deliverInvite({
      email,
      displayName: profile?.display_name ?? "colaborador",
      role: target.role,
    });

    if (!delivery.ok) {
      return { error: describeDeliveryFailure(delivery.reason) };
    }

    await logTeamAudit("invite_resent", parsed.data.collaboratorId, {
      origin: "equipe",
    });

    return { success: true, message: TEAM_COPY.inviteSent };
  } catch (error) {
    return toActionError(error, "Não foi possível reenviar o convite");
  }
}
