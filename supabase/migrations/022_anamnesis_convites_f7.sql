-- F7-03: convites de anamnese isolada (impressão digital, validade, finalidade)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'anamnesis_invite_purpose'
  ) THEN
    CREATE TYPE public.anamnesis_invite_purpose AS ENUM ('pre_consult', 'office');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'anamnesis_invite_status'
  ) THEN
    CREATE TYPE public.anamnesis_invite_status AS ENUM ('open', 'used', 'revoked');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.anamnesis_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  purpose public.anamnesis_invite_purpose NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status public.anamnesis_invite_status NOT NULL DEFAULT 'open',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_invites_patient
  ON public.anamnesis_invites (patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnesis_invites_one_open_per_purpose
  ON public.anamnesis_invites (patient_id, purpose)
  WHERE status = 'open';

ALTER TABLE public.anamnesis_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anamnesis_invites_select ON public.anamnesis_invites;
CREATE POLICY anamnesis_invites_select ON public.anamnesis_invites
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

DROP POLICY IF EXISTS anamnesis_invites_write ON public.anamnesis_invites;
CREATE POLICY anamnesis_invites_write ON public.anamnesis_invites
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnesis_invites TO authenticated;

-- Seed de desenvolvimento: convite pré-consulta da Maria (token só no comentário)
-- Token em claro (nunca persistido): clinroma-dev-anamnesis-preconsult-001
-- URL local: https://localhost:3000/anamnese/clinroma-dev-anamnesis-preconsult-001
INSERT INTO public.anamnesis_invites (
  id,
  patient_id,
  purpose,
  token_hash,
  status,
  expires_at,
  created_by
)
VALUES (
  'a7000001-0000-4000-8000-000000000001',
  'c1000001-0000-4000-8000-000000000001',
  'pre_consult',
  '0712e382a2cd48ff8e71f09dd10cda5fd2bb50fccdc90709468e2da28bc5da3a',
  'open',
  now() + interval '7 days',
  'b2000001-0000-4000-8000-000000000003'
)
ON CONFLICT (id) DO NOTHING;
