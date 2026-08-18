-- Fase 3: reforços incrementais em pacientes e prontuário

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'medical_records_appointment_id_fkey'
  ) THEN
    ALTER TABLE public.medical_records
      ADD CONSTRAINT medical_records_appointment_id_fkey
      FOREIGN KEY (appointment_id)
      REFERENCES public.appointments (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm
  ON public.patients
  USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_patients_full_name_lower
  ON public.patients (lower(full_name));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS patients_set_updated_at ON public.patients;
CREATE TRIGGER patients_set_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS medical_records_set_updated_at ON public.medical_records;
CREATE TRIGGER medical_records_set_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tooth_findings_set_updated_at ON public.tooth_findings;
CREATE TRIGGER tooth_findings_set_updated_at
  BEFORE UPDATE ON public.tooth_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
