import type { UserRole } from "@/types/clinroma";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administração",
  dentist: "Dentista",
  reception: "Recepção",
  room_assistant: "Auxiliar de sala",
  viewer: "Visualização",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
