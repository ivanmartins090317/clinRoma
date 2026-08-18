-- Pacientes, prontuário, odontograma e anexos

CREATE TYPE public.medical_record_type AS ENUM ('anamnesis', 'evolution');
CREATE TYPE public.record_attachment_type AS ENUM ('photo', 'audio');
CREATE TYPE public.transcription_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  birth_date date,
  cpf text,
  contact_phone text,
  contact_email text,
  lgpd_consent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patients_cpf_unique UNIQUE (cpf)
);

CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.dentists (id) ON DELETE SET NULL,
  appointment_id uuid,
  record_type public.medical_record_type NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tooth_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  tooth_number smallint NOT NULL CHECK (tooth_number BETWEEN 11 AND 48),
  tooth_surface text NOT NULL,
  condition_code text NOT NULL,
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tooth_findings_unique UNIQUE (patient_id, tooth_number, tooth_surface)
);

CREATE TABLE public.record_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  attachment_type public.record_attachment_type NOT NULL,
  transcription text,
  transcription_status public.transcription_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_records_patient ON public.medical_records (patient_id);
CREATE INDEX idx_tooth_findings_patient ON public.tooth_findings (patient_id);
CREATE INDEX idx_record_attachments_record ON public.record_attachments (medical_record_id);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tooth_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY patients_select ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'viewer'
    ]::public.user_role[])
  );

CREATE POLICY patients_write ON public.patients
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY medical_records_select ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY medical_records_write ON public.medical_records
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY tooth_findings_select ON public.tooth_findings
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY tooth_findings_write ON public.tooth_findings
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY record_attachments_select ON public.record_attachments
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY record_attachments_write ON public.record_attachments
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tooth_findings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_attachments TO authenticated;
