-- Consultas agendadas

CREATE TYPE public.appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
  'rescheduled'
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  dentist_id uuid NOT NULL REFERENCES public.dentists (id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  procedure_name text,
  notes text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_ends_after_starts CHECK (ends_at > starts_at)
);

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES public.appointments (id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_dentist_starts ON public.appointments (dentist_id, starts_at);
CREATE INDEX idx_appointments_patient ON public.appointments (patient_id);
CREATE INDEX idx_appointments_status ON public.appointments (status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_select ON public.appointments
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'viewer'
    ]::public.user_role[])
  );

CREATE POLICY appointments_write ON public.appointments
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'reception']::public.user_role[])
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
