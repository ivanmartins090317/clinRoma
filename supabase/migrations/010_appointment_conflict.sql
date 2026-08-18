-- Bloqueio de sobreposição de consultas ativas do mesmo dentista.
-- Consultas cancelled e rescheduled não participam do bloqueio.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_active_overlap;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_active_overlap
  EXCLUDE USING gist (
    dentist_id WITH =,
    tstzrange (starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'rescheduled'));
