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
          secondary_phone: string | null;
          secondary_phone_note: string | null;
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
          secondary_phone?: string | null;
          secondary_phone_note?: string | null;
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
          secondary_phone?: string | null;
          secondary_phone_note?: string | null;
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
      waitlist_entries: {
        Row: {
          id: string;
          patient_id: string;
          priority: Database["public"]["Enums"]["waitlist_priority"];
          reason: string | null;
          preferred_dentist_id: string | null;
          status: Database["public"]["Enums"]["waitlist_entry_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          priority: Database["public"]["Enums"]["waitlist_priority"];
          reason?: string | null;
          preferred_dentist_id?: string | null;
          status?: Database["public"]["Enums"]["waitlist_entry_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          priority?: Database["public"]["Enums"]["waitlist_priority"];
          reason?: string | null;
          preferred_dentist_id?: string | null;
          status?: Database["public"]["Enums"]["waitlist_entry_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      slot_offers: {
        Row: {
          id: string;
          waitlist_entry_id: string;
          offered_at: string;
          ends_at: string;
          dentist_id: string;
          token_hash: string;
          expires_at: string;
          status: Database["public"]["Enums"]["slot_offer_status"];
          appointment_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          waitlist_entry_id: string;
          offered_at: string;
          ends_at: string;
          dentist_id: string;
          token_hash: string;
          expires_at: string;
          status?: Database["public"]["Enums"]["slot_offer_status"];
          appointment_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          waitlist_entry_id?: string;
          offered_at?: string;
          ends_at?: string;
          dentist_id?: string;
          token_hash?: string;
          expires_at?: string;
          status?: Database["public"]["Enums"]["slot_offer_status"];
          appointment_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      patient_slot_responses: {
        Row: {
          id: string;
          slot_offer_id: string;
          response: Database["public"]["Enums"]["slot_response"];
          lgpd_consent: boolean;
          responded_at: string;
          ip_hash: string;
        };
        Insert: {
          id?: string;
          slot_offer_id: string;
          response: Database["public"]["Enums"]["slot_response"];
          lgpd_consent?: boolean;
          responded_at?: string;
          ip_hash: string;
        };
        Update: {
          id?: string;
          slot_offer_id?: string;
          response?: Database["public"]["Enums"]["slot_response"];
          lgpd_consent?: boolean;
          responded_at?: string;
          ip_hash?: string;
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
      supply_packages: {
        Row: {
          id: string;
          supply_id: string;
          qr_code: string;
          quantity: number;
          remaining_quantity: number;
          lot_number: string | null;
          expires_at: string | null;
          status: Database["public"]["Enums"]["supply_package_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supply_id: string;
          qr_code: string;
          quantity: number;
          remaining_quantity?: number;
          lot_number?: string | null;
          expires_at?: string | null;
          status?: Database["public"]["Enums"]["supply_package_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supply_id?: string;
          qr_code?: string;
          quantity?: number;
          remaining_quantity?: number;
          lot_number?: string | null;
          expires_at?: string | null;
          status?: Database["public"]["Enums"]["supply_package_status"];
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
          adjustment_direction: string | null;
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
          adjustment_direction?: string | null;
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
          adjustment_direction?: string | null;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stock_finance_alerts: {
        Row: {
          id: string;
          supply_id: string;
          current_quantity: number;
          minimum_quantity: number;
          status: Database["public"]["Enums"]["stock_finance_alert_status"];
          attempt_count: number;
          next_attempt_at: string;
          error_message: string | null;
          sent_at: string | null;
          episode_closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supply_id: string;
          current_quantity: number;
          minimum_quantity: number;
          status?: Database["public"]["Enums"]["stock_finance_alert_status"];
          attempt_count?: number;
          next_attempt_at?: string;
          error_message?: string | null;
          sent_at?: string | null;
          episode_closed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          supply_id?: string;
          current_quantity?: number;
          minimum_quantity?: number;
          status?: Database["public"]["Enums"]["stock_finance_alert_status"];
          attempt_count?: number;
          next_attempt_at?: string;
          error_message?: string | null;
          sent_at?: string | null;
          episode_closed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      supply_sheets: {
        Row: {
          id: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          storage_path?: string;
          mime_type?: string;
          file_size_bytes?: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          appointment_id: string;
          dentist_id: string;
          channel: Database["public"]["Enums"]["reminder_channel"];
          status: Database["public"]["Enums"]["reminder_status"];
          sent_at: string | null;
          error_message: string | null;
          attempt_count: number;
          next_attempt_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          dentist_id: string;
          channel?: Database["public"]["Enums"]["reminder_channel"];
          status?: Database["public"]["Enums"]["reminder_status"];
          sent_at?: string | null;
          error_message?: string | null;
          attempt_count?: number;
          next_attempt_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          dentist_id?: string;
          channel?: Database["public"]["Enums"]["reminder_channel"];
          status?: Database["public"]["Enums"]["reminder_status"];
          sent_at?: string | null;
          error_message?: string | null;
          attempt_count?: number;
          next_attempt_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      anamnesis_invites: {
        Row: {
          id: string;
          patient_id: string;
          purpose: Database["public"]["Enums"]["anamnesis_invite_purpose"];
          token_hash: string;
          status: Database["public"]["Enums"]["anamnesis_invite_status"];
          expires_at: string;
          used_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          purpose: Database["public"]["Enums"]["anamnesis_invite_purpose"];
          token_hash: string;
          status?: Database["public"]["Enums"]["anamnesis_invite_status"];
          expires_at: string;
          used_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          purpose?: Database["public"]["Enums"]["anamnesis_invite_purpose"];
          token_hash?: string;
          status?: Database["public"]["Enums"]["anamnesis_invite_status"];
          expires_at?: string;
          used_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_messages: {
        Row: {
          id: string;
          patient_id: string;
          appointment_id: string | null;
          purpose: Database["public"]["Enums"]["patient_message_purpose"];
          destination_digits: string;
          contact_source: Database["public"]["Enums"]["patient_message_contact_source"];
          body: string;
          status: Database["public"]["Enums"]["patient_message_status"];
          error_message: string | null;
          created_by: string | null;
          created_at: string;
          sent_at: string | null;
          scheduled_at: string | null;
          attempt_count: number;
        };
        Insert: {
          id?: string;
          patient_id: string;
          appointment_id?: string | null;
          purpose: Database["public"]["Enums"]["patient_message_purpose"];
          destination_digits: string;
          contact_source: Database["public"]["Enums"]["patient_message_contact_source"];
          body: string;
          status?: Database["public"]["Enums"]["patient_message_status"];
          error_message?: string | null;
          created_by?: string | null;
          created_at?: string;
          sent_at?: string | null;
          scheduled_at?: string | null;
          attempt_count?: number;
        };
        Update: {
          id?: string;
          patient_id?: string;
          appointment_id?: string | null;
          purpose?: Database["public"]["Enums"]["patient_message_purpose"];
          destination_digits?: string;
          contact_source?: Database["public"]["Enums"]["patient_message_contact_source"];
          body?: string;
          status?: Database["public"]["Enums"]["patient_message_status"];
          error_message?: string | null;
          created_by?: string | null;
          created_at?: string;
          sent_at?: string | null;
          scheduled_at?: string | null;
          attempt_count?: number;
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
    Functions: {
      expire_pending_slot_offers: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
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
      waitlist_priority: "red" | "yellow" | "green";
      waitlist_entry_status:
        "waiting" | "offered" | "scheduled" | "cancelled" | "expired";
      slot_offer_status: "pending" | "accepted" | "declined" | "expired";
      slot_response: "accept" | "decline";
      medical_record_type: "anamnesis" | "evolution";
      record_attachment_type: "photo" | "audio";
      transcription_status: "pending" | "processing" | "completed" | "failed";
      supply_movement_type: "in" | "out" | "adjustment";
      supply_package_status: "active" | "depleted" | "expired";
      supply_unit: "unit" | "box" | "roll" | "bottle";
      reminder_channel: "email" | "whatsapp";
      reminder_status: "pending" | "sent" | "failed";
      stock_finance_alert_status: "pending" | "sent" | "failed" | "cancelled";
      anamnesis_invite_purpose: "pre_consult" | "office";
      anamnesis_invite_status: "open" | "used" | "revoked";
      patient_message_purpose: "post_surgery" | "anamnesis_invite";
      patient_message_contact_source: "patient_phone" | "secondary_phone";
      patient_message_status: "pending" | "sent" | "failed" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
