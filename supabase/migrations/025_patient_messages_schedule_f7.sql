-- F7-05b: agendamento de mensagem pós-cirurgia (relógio no ClinRoma, disparo WAHA)

ALTER TYPE public.patient_message_status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE public.patient_messages
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.patient_messages
  DROP CONSTRAINT IF EXISTS patient_messages_attempt_count_nonnegative;

ALTER TABLE public.patient_messages
  ADD CONSTRAINT patient_messages_attempt_count_nonnegative
  CHECK (attempt_count >= 0);

CREATE INDEX IF NOT EXISTS idx_patient_messages_due
  ON public.patient_messages (status, scheduled_at)
  WHERE status = 'pending' AND scheduled_at IS NOT NULL;
