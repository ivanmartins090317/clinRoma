import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import type { UserRole } from "@/types/clinroma";

export interface CollaboratorProfile {
  id: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  profile: CollaboratorProfile;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      role: profile.role as UserRole,
      active: profile.active,
    },
  };
}

export async function requireAuthSession(
  returnTo?: string,
): Promise<AuthSession> {
  const session = await getAuthSession();

  if (!session) {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${query}`);
  }

  return session;
}
