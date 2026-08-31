import { generateTempPassword } from "@/features/team/domain/temp-password";
import { getAppBaseUrl } from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/clinroma";

export interface ProvisionCollaboratorInput {
  email: string;
  displayName: string;
  role: UserRole;
}

export interface ProvisionedCollaborator {
  userId: string;
  tempPassword: string;
}

export type ProvisionResult =
  | { ok: true; value: ProvisionedCollaborator }
  | { ok: false; reason: "email_in_use" | "failed" };

/**
 * O trigger handle_new_user cria o profile sempre como viewer; o papel real só
 * é aplicado aqui, com service_role, para que ninguém se autopromova no signup.
 */
export async function provisionCollaborator(
  input: ProvisionCollaboratorInput,
): Promise<ProvisionResult> {
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  if (error || !data.user) {
    const alreadyRegistered =
      error?.code === "email_exists" ||
      error?.message.toLowerCase().includes("already");

    return { ok: false, reason: alreadyRegistered ? "email_in_use" : "failed" };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ display_name: input.displayName, role: input.role })
    .eq("id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, reason: "failed" };
  }

  return { ok: true, value: { userId: data.user.id, tempPassword } };
}

export async function createSetPasswordLink(
  email: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${getAppBaseUrl()}/login` },
  });

  if (error || !data.properties?.action_link) {
    return null;
  }

  return data.properties.action_link;
}
