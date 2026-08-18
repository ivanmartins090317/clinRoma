export const ANAMNESIS_FORM_VERSION = 1;

export interface AnamnesisFormField {
  id: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

export interface AnamnesisFormSection {
  id: string;
  title: string;
  fields: AnamnesisFormField[];
}

export const ANAMNESIS_FORM_SECTIONS: AnamnesisFormSection[] = [
  {
    id: "general_health",
    title: "Saúde geral",
    fields: [
      {
        id: "generalHealth",
        label: "Como avalia sua saúde geral?",
        placeholder: "Ex.: Boa, sem queixas recentes",
        multiline: true,
      },
      {
        id: "lastDentalVisit",
        label: "Última consulta odontológica",
        placeholder: "Ex.: Há 6 meses",
      },
    ],
  },
  {
    id: "allergies",
    title: "Alergias",
    fields: [
      {
        id: "allergies",
        label: "Alergias medicamentosas ou outras",
        placeholder: "Ex.: Penicilina, látex, nenhuma conhecida",
        multiline: true,
      },
    ],
  },
  {
    id: "medications",
    title: "Medicamentos em uso",
    fields: [
      {
        id: "medications",
        label: "Medicamentos contínuos",
        placeholder: "Ex.: Losartana 50 mg, nenhum",
        multiline: true,
      },
    ],
  },
  {
    id: "systemic",
    title: "Condições sistêmicas",
    fields: [
      {
        id: "systemicConditions",
        label: "Doenças ou condições relevantes",
        placeholder: "Ex.: Hipertensão controlada, diabetes, nenhuma",
        multiline: true,
      },
      {
        id: "pregnancy",
        label: "Gestação ou amamentação",
        placeholder: "Ex.: Não se aplica",
      },
    ],
  },
  {
    id: "habits",
    title: "Hábitos",
    fields: [
      {
        id: "habits",
        label: "Hábitos de higiene e outros",
        placeholder: "Ex.: Escova 3x ao dia, não fuma",
        multiline: true,
      },
      {
        id: "chiefComplaint",
        label: "Queixa principal",
        placeholder: "Motivo da consulta",
        multiline: true,
      },
    ],
  },
];

export interface AnamnesisContentV1 {
  formVersion: typeof ANAMNESIS_FORM_VERSION;
  signedAt: string;
  signatureName: string;
  signatureConfirmed: boolean;
  generalHealth?: string;
  lastDentalVisit?: string;
  allergies?: string;
  medications?: string;
  systemicConditions?: string;
  pregnancy?: string;
  habits?: string;
  chiefComplaint?: string;
}

export function buildAnamnesisPreview(content: AnamnesisContentV1): string {
  const parts = [
    content.chiefComplaint,
    content.allergies,
    content.medications,
  ].filter(Boolean);

  return parts.join(" · ") || "Anamnese preenchida";
}
