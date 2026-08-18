-- Seed Fase 3: consentimento LGPD e demo clínico (idempotente)

UPDATE public.patients
SET
  lgpd_consent_at = now() - interval '30 days',
  updated_at = now()
WHERE id = 'c1000001-0000-4000-8000-000000000001'
  AND lgpd_consent_at IS NULL;

UPDATE public.patients
SET
  lgpd_consent_at = now() - interval '60 days',
  updated_at = now()
WHERE id = 'c1000001-0000-4000-8000-000000000002'
  AND lgpd_consent_at IS NULL;

INSERT INTO public.medical_records (
  id,
  patient_id,
  dentist_id,
  record_type,
  content,
  created_by
)
VALUES (
  'e1000001-0000-4000-8000-000000000001',
  'c1000001-0000-4000-8000-000000000001',
  'a1000001-0000-4000-8000-000000000001',
  'anamnesis',
  jsonb_build_object(
    'formVersion', 1,
    'signedAt', (now() - interval '30 days')::text,
    'signatureName', 'Maria Silva',
    'generalHealth', 'Boa saúde geral',
    'allergies', 'Nenhuma conhecida',
    'medications', 'Nenhum uso contínuo',
    'systemicConditions', 'Nenhuma',
    'habits', 'Escovação 3x ao dia',
    'signatureConfirmed', true
  ),
  'b2000001-0000-4000-8000-000000000002'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tooth_findings (
  id,
  patient_id,
  tooth_number,
  tooth_surface,
  condition_code,
  updated_by
)
VALUES (
  'f1000001-0000-4000-8000-000000000001',
  'c1000001-0000-4000-8000-000000000001',
  36,
  'oclusal',
  'restoration',
  'b2000001-0000-4000-8000-000000000002'
)
ON CONFLICT (patient_id, tooth_number, tooth_surface) DO NOTHING;
