-- Seed F7-02: duas evoluções de texto da Maria para demo da busca.
-- Idempotente. Não altera seeds anteriores nem cria schema.

INSERT INTO public.medical_records (
  id,
  patient_id,
  dentist_id,
  record_type,
  content,
  created_by,
  created_at,
  updated_at
)
VALUES
  (
    'e2000001-0000-4000-8000-000000000001',
    'c1000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    'evolution',
    jsonb_build_object(
      'text',
      'Extração do dente 24 em sessão única. Paciente tolerou bem o procedimento.'
    ),
    'b2000001-0000-4000-8000-000000000002',
    now() - interval '7 days',
    now() - interval '7 days'
  ),
  (
    'e2000001-0000-4000-8000-000000000002',
    'c1000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    'evolution',
    jsonb_build_object(
      'text',
      'Profilaxia e orientação de higiene bucal. Sem queixa de dor.'
    ),
    'b2000001-0000-4000-8000-000000000002',
    now() - interval '2 days',
    now() - interval '2 days'
  )
ON CONFLICT (id) DO NOTHING;
