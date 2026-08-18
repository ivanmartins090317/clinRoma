-- Fila de espera, ofertas de horário e respostas do paciente

CREATE TYPE public.waitlist_priority AS ENUM ('red', 'yellow', 'green');
CREATE TYPE public.waitlist_entry_status AS ENUM (
  'waiting',
  'offered',
  'scheduled',
  'cancelled',
  'expired'
);
CREATE TYPE public.slot_offer_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired'
);
CREATE TYPE public.slot_response AS ENUM ('accept', 'decline');

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  priority public.waitlist_priority NOT NULL,
  reason text,
  preferred_dentist_id uuid REFERENCES public.dentists (id) ON DELETE SET NULL,
  status public.waitlist_entry_status NOT NULL DEFAULT 'waiting',
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.slot_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_entry_id uuid NOT NULL REFERENCES public.waitlist_entries (id) ON DELETE CASCADE,
  offered_at timestamptz NOT NULL,
  dentist_id uuid NOT NULL REFERENCES public.dentists (id) ON DELETE RESTRICT,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  status public.slot_offer_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slot_offers_token_hash_unique UNIQUE (token_hash)
);

CREATE TABLE public.patient_slot_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_offer_id uuid NOT NULL REFERENCES public.slot_offers (id) ON DELETE CASCADE,
  response public.slot_response NOT NULL,
  lgpd_consent boolean NOT NULL DEFAULT false,
  responded_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text NOT NULL
);

CREATE INDEX idx_waitlist_entries_status ON public.waitlist_entries (status);
CREATE INDEX idx_slot_offers_entry ON public.slot_offers (waitlist_entry_id);
CREATE INDEX idx_slot_offers_token_hash ON public.slot_offers (token_hash);

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_slot_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY waitlist_entries_select ON public.waitlist_entries
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY waitlist_entries_write ON public.waitlist_entries
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]));

CREATE POLICY slot_offers_select ON public.slot_offers
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY slot_offers_write ON public.slot_offers
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]));

-- Respostas públicas via rota dedicada (Fase 4); sem SELECT para authenticated por padrão
CREATE POLICY patient_slot_responses_insert_service ON public.patient_slot_responses
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY patient_slot_responses_select ON public.patient_slot_responses
  FOR SELECT TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slot_offers TO authenticated;
GRANT SELECT, INSERT ON public.patient_slot_responses TO authenticated;
