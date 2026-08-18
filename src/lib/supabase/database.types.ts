export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: Database["public"]["Enums"]["user_role"];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: Database["public"]["Enums"]["user_role"];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dentists: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string;
          cro: string | null;
          calendar_color: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          full_name: string;
          cro?: string | null;
          calendar_color?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          full_name?: string;
          cro?: string | null;
          calendar_color?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          full_name: string;
          birth_date: string | null;
          cpf: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          lgpd_consent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          birth_date?: string | null;
          cpf?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          lgpd_consent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          birth_date?: string | null;
          cpf?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          lgpd_consent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medical_records: {
        Row: {
          id: string;
          patient_id: string;
          dentist_id: string | null;
          appointment_id: string | null;
          record_type: Database["public"]["Enums"]["medical_record_type"];
          content: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          dentist_id?: string | null;
          appointment_id?: string | null;
          record_type: Database["public"]["Enums"]["medical_record_type"];
          content?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          dentist_id?: string | null;
          appointment_id?: string | null;
          record_type?: Database["public"]["Enums"]["medical_record_type"];
          content?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tooth_findings: {
        Row: {
          id: string;
          patient_id: string;
          tooth_number: number;
          tooth_surface: string;
          condition_code: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          tooth_number: number;
          tooth_surface: string;
          condition_code: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          tooth_number?: number;
          tooth_surface?: string;
          condition_code?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      record_attachments: {
        Row: {
          id: string;
          medical_record_id: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          attachment_type: Database["public"]["Enums"]["record_attachment_type"];
          transcription: string | null;
          transcription_status: Database["public"]["Enums"]["transcription_status"];
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          medical_record_id: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          attachment_type: Database["public"]["Enums"]["record_attachment_type"];
          transcription?: string | null;
          transcription_status?: Database["public"]["Enums"]["transcription_status"];
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          medical_record_id?: string;
          storage_path?: string;
          mime_type?: string;
          file_size_bytes?: number;
          attachment_type?: Database["public"]["Enums"]["record_attachment_type"];
          transcription?: string | null;
          transcription_status?: Database["public"]["Enums"]["transcription_status"];
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          dentist_id: string;
          starts_at: string;
          ends_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          procedure_name: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          dentist_id: string;
          starts_at: string;
          ends_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          procedure_name?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          dentist_id?: string;
          starts_at?: string;
          ends_at?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          procedure_name?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplies: {
        Row: {
          id: string;
          name: string;
          unit: Database["public"]["Enums"]["supply_unit"];
          current_quantity: number;
          minimum_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit?: Database["public"]["Enums"]["supply_unit"];
          current_quantity?: number;
          minimum_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: Database["public"]["Enums"]["supply_unit"];
          current_quantity?: number;
          minimum_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supply_movements: {
        Row: {
          id: string;
          supply_id: string;
          package_id: string | null;
          movement_type: Database["public"]["Enums"]["supply_movement_type"];
          quantity: number;
          performed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supply_id: string;
          package_id?: string | null;
          movement_type: Database["public"]["Enums"]["supply_movement_type"];
          quantity: number;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          supply_id?: string;
          package_id?: string | null;
          movement_type?: Database["public"]["Enums"]["supply_movement_type"];
          quantity?: number;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role:
        "admin" | "dentist" | "reception" | "room_assistant" | "viewer";
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "no_show"
        | "cancelled"
        | "rescheduled";
      medical_record_type: "anamnesis" | "evolution";
      record_attachment_type: "photo" | "audio";
      transcription_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed";
      supply_movement_type: "in" | "out" | "adjustment";
      supply_unit: "unit" | "box" | "roll" | "bottle";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
