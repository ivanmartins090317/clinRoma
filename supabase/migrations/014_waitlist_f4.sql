-- Fase 4: reforços incrementais na fila Kanban

ALTER TABLE public.slot_offers
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments (id) ON DELETE SET NULL;

UPDATE public.slot_offers
SET ends_at = offered_at + interval '30 minutes'
WHERE ends_at IS NULL;

ALTER TABLE public.slot_offers
  ALTER COLUMN ends_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_offers_one_pending_per_entry
  ON public.slot_offers (waitlist_entry_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_entries_one_active_per_patient
  ON public.waitlist_entries (patient_id)
  WHERE status IN ('waiting', 'offered');

CREATE OR REPLACE FUNCTION public.expire_pending_slot_offers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH expired_offers AS (
    UPDATE public.slot_offers
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < now()
    RETURNING id, waitlist_entry_id
  ),
  updated_entries AS (
    UPDATE public.waitlist_entries we
    SET
      status = 'waiting',
      updated_at = now()
    FROM expired_offers eo
    WHERE we.id = eo.waitlist_entry_id
      AND we.status = 'offered'
    RETURNING we.id
  )
  SELECT count(*)::integer INTO affected FROM expired_offers;

  RETURN COALESCE(affected, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_pending_slot_offers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_pending_slot_offers() TO service_role;

DROP POLICY IF EXISTS patient_slot_responses_insert_service ON public.patient_slot_responses;
