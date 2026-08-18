-- Fase 6: retentativa de lembretes e unicidade por consulta/canal

ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_appointment_channel
  ON public.reminders (appointment_id, channel);

CREATE INDEX IF NOT EXISTS idx_reminders_pending_retry
  ON public.reminders (status, next_attempt_at)
  WHERE status = 'pending';
