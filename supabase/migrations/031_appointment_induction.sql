-- Tempo de medicação no início da consulta.
-- A visita do paciente continua de starts_at até ends_at.
-- A trava do dentista passa a valer no trecho exclusivo.

ALTER TABLE public.appointments
  ADD COLUMN induction_minutes integer NOT NULL DEFAULT 0;

-- Somar minutos a timestamptz é estável no Postgres, não imutável.
-- A coluna gerada exige uma função imutável. Minutos não dependem de fuso.
CREATE OR REPLACE FUNCTION public.appointment_busy_start(
  p_starts_at timestamptz,
  p_induction_minutes integer
) RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_starts_at + (p_induction_minutes * interval '1 minute');
$$;

GRANT EXECUTE ON FUNCTION public.appointment_busy_start(timestamptz, integer)
  TO authenticated, service_role;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_induction_within_visit CHECK (
    induction_minutes >= 0
    AND public.appointment_busy_start(starts_at, induction_minutes) < ends_at
  );

ALTER TABLE public.appointments
  ADD COLUMN busy_starts_at timestamptz
    GENERATED ALWAYS AS (
      public.appointment_busy_start(starts_at, induction_minutes)
    ) STORED,
  ADD COLUMN busy_ends_at timestamptz
    GENERATED ALWAYS AS (ends_at) STORED;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_active_overlap;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_active_overlap
  EXCLUDE USING gist (
    dentist_id WITH =,
    tstzrange (busy_starts_at, busy_ends_at, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'rescheduled'))
  DEFERRABLE INITIALLY IMMEDIATE;

CREATE OR REPLACE FUNCTION public.save_scheduled_appointment(
  p_id uuid,
  p_patient_id uuid,
  p_dentist_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status public.appointment_status,
  p_procedure_name text,
  p_notes text,
  p_created_by uuid,
  p_induction_minutes integer,
  p_partner_id uuid,
  p_partner_induction integer,
  p_release_partner_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SET CONSTRAINTS public.appointments_no_active_overlap DEFERRED;

  IF p_id IS NULL THEN
    INSERT INTO public.appointments (
      patient_id,
      dentist_id,
      starts_at,
      ends_at,
      status,
      procedure_name,
      notes,
      created_by,
      induction_minutes
    ) VALUES (
      p_patient_id,
      p_dentist_id,
      p_starts_at,
      p_ends_at,
      p_status,
      p_procedure_name,
      p_notes,
      p_created_by,
      p_induction_minutes
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.appointments
    SET
      patient_id = p_patient_id,
      dentist_id = p_dentist_id,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      status = p_status,
      procedure_name = p_procedure_name,
      notes = p_notes,
      induction_minutes = p_induction_minutes,
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'appointment_not_found';
    END IF;
  END IF;

  IF p_partner_id IS NOT NULL THEN
    UPDATE public.appointments
    SET
      induction_minutes = COALESCE(p_partner_induction, 0),
      updated_at = now()
    WHERE id = p_partner_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'partner_not_found';
    END IF;
  END IF;

  IF p_release_partner_id IS NOT NULL
     AND p_release_partner_id IS DISTINCT FROM p_partner_id THEN
    UPDATE public.appointments
    SET
      induction_minutes = 0,
      updated_at = now()
    WHERE id = p_release_partner_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'partner_not_found';
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_scheduled_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.appointment_status,
  text, text, uuid, integer, uuid, integer, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_scheduled_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.appointment_status,
  text, text, uuid, integer, uuid, integer, uuid
) TO authenticated;
