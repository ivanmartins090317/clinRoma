import type { CollaboratorState } from "@/features/team/domain/team-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/clinroma";

export interface DentistCardSummary {
  id: string;
  fullName: string;
  cro: string | null;
  calendarColor: string;
  active: boolean;
}

export interface CollaboratorListItem extends CollaboratorState {
  displayName: string;
  email: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  dentistCard: DentistCardSummary | null;
}

interface AuthUserSummary {
  email: string | null;
  lastSignInAt: string | null;
}

/** Single-tenant: o piloto tem poucas contas, uma página de listUsers basta. */
const AUTH_USERS_PAGE_SIZE = 200;

async function loadAuthUserSummaries(): Promise<Map<string, AuthUserSummary>> {
  const summaries = new Map<string, AuthUserSummary>();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (error || !data) {
      return summaries;
    }

    for (const user of data.users) {
      summaries.set(user.id, {
        email: user.email ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      });
    }
  } catch {
    return summaries;
  }

  return summaries;
}

async function loadDentistCardsByProfile(): Promise<
  Map<string, DentistCardSummary>
> {
  const cards = new Map<string, DentistCardSummary>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("id, profile_id, full_name, cro, calendar_color, active")
    .not("profile_id", "is", null);

  if (error || !data) {
    return cards;
  }

  for (const row of data) {
    if (!row.profile_id) {
      continue;
    }

    cards.set(row.profile_id, {
      id: row.id,
      fullName: row.full_name,
      cro: row.cro,
      calendarColor: row.calendar_color,
      active: row.active,
    });
  }

  return cards;
}

export async function listCollaborators(): Promise<CollaboratorListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, active, created_at")
    .order("active", { ascending: false })
    .order("display_name", { ascending: true });

  if (error || !data) {
    return [];
  }

  const summaries = await loadAuthUserSummaries();
  const dentistCards = await loadDentistCardsByProfile();

  return data.map((row) => {
    const summary = summaries.get(row.id);

    return {
      id: row.id,
      displayName: row.display_name,
      role: row.role as UserRole,
      active: row.active,
      email: summary?.email ?? null,
      lastSignInAt: summary?.lastSignInAt ?? null,
      createdAt: row.created_at,
      dentistCard: dentistCards.get(row.id) ?? null,
    };
  });
}

export async function getCollaboratorStates(): Promise<CollaboratorState[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, active");

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    role: row.role as UserRole,
    active: row.active,
  }));
}

export async function getCollaboratorEmail(
  collaboratorId: string,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(collaboratorId);

    if (error || !data.user?.email) {
      return null;
    }

    return data.user.email;
  } catch {
    return null;
  }
}
