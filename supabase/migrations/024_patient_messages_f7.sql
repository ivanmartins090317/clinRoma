-- F7-04 / F7-05: registro de disparo WhatsApp ao paciente (pós-cirurgia e convite)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'patient_message_purpose'
  ) THEN
    CREATE TYPE public.patient_message_purpose AS ENUM (
      'post_surgery',
      'anamnesis_invite'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'patient_message_contact_source'
  ) THEN
    CREATE TYPE public.patient_message_contact_source AS ENUM (
      'patient_phone',
      'secondary_phone'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'patient_message_status'
  ) THEN
    CREATE TYPE public.patient_message_status AS ENUM (
      'pending',
      'sent',
      'failed'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.patient_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments (id) ON DELETE SET NULL,
  purpose public.patient_message_purpose NOT NULL,
  destination_digits text NOT NULL,
  contact_source public.patient_message_contact_source NOT NULL,
  body text NOT NULL,
  status public.patient_message_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_patient_messages_patient_purpose
  ON public.patient_messages (patient_id, purpose, created_at DESC);

ALTER TABLE public.patient_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.patient_messages FROM PUBLIC;
REVOKE ALL ON public.patient_messages FROM anon;
REVOKE ALL ON public.patient_messages FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON public.patient_messages TO authenticated;

DROP POLICY IF EXISTS patient_messages_select ON public.patient_messages;
CREATE POLICY patient_messages_select ON public.patient_messages
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

DROP POLICY IF EXISTS patient_messages_insert ON public.patient_messages;
CREATE POLICY patient_messages_insert ON public.patient_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

DROP POLICY IF EXISTS patient_messages_update ON public.patient_messages;
CREATE POLICY patient_messages_update ON public.patient_messages
  FOR UPDATE TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );
