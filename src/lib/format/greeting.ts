import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return "Bom dia";
  }

  if (hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

export function formatHeroDate(date = new Date()): string {
  const formatted = format(date, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}
