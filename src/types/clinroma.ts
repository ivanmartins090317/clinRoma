export type UserRole =
  "admin" | "dentist" | "reception" | "room_assistant" | "viewer";

export type WaitlistPriorityColor = "red" | "yellow" | "green";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled"
  | "rescheduled";

export type SupplyType = "unit" | "box" | "roll" | "bottle";

export interface ClinicModule {
  id: string;
  label: string;
  href: string;
  description: string;
}

export const CLINROMA_MODULES: ClinicModule[] = [
  {
    id: "today",
    label: "Hoje",
    href: "/hoje",
    description: "Consultas do dia, alertas e fila ativa",
  },
  {
    id: "agenda",
    label: "Agenda",
    href: "/agenda",
    description: "Calendário · 5 dentistas",
  },
  {
    id: "patients",
    label: "Pacientes",
    href: "/pacientes",
    description: "Ficha, anamnese e prontuário",
  },
  {
    id: "waitlist",
    label: "Fila",
    href: "/fila",
    description: "Vermelho · Amarelo · Verde · 40 min",
  },
  {
    id: "stock",
    label: "Estoque",
    href: "/estoque",
    description: "Insumos, QR code e alertas",
  },
  {
    id: "stock-scan",
    label: "Scan QR",
    href: "/estoque/scan",
    description: "Retirada por leitura de pacote",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "/whatsapp",
    description: "Pareamento da sessão da clínica",
  },
];

export const WAITLIST_COLORS: Record<
  WaitlistPriorityColor,
  { label: string; order: number; className: string; hex: string }
> = {
  red: {
    label: "Vermelho",
    order: 1,
    className: "bg-priority-red",
    hex: "#B8323A",
  },
  yellow: {
    label: "Amarelo",
    order: 2,
    className: "bg-priority-yellow",
    hex: "#D4A017",
  },
  green: {
    label: "Verde",
    order: 3,
    className: "bg-priority-green",
    hex: "#3D7A5C",
  },
};
