-- Seed Fase 4: entradas na fila e oferta pendente de teste (idempotente)

INSERT INTO public.waitlist_entries (
  id,
  patient_id,
  priority,
  reason,
  preferred_dentist_id,
  status,
  created_by
)
VALUES
  (
    'f4000001-0000-4000-8000-000000000001',
    'c1000001-0000-4000-8000-000000000003',
    'red',
    'Dor intensa',
    'a1000001-0000-4000-8000-000000000001',
    'waiting',
    'b2000001-0000-4000-8000-000000000003'
  ),
  (
    'f4000001-0000-4000-8000-000000000002',
    'c1000001-0000-4000-8000-000000000004',
    'yellow',
    'Retorno urgente',
    'a1000001-0000-4000-8000-000000000002',
    'waiting',
    'b2000001-0000-4000-8000-000000000003'
  ),
  (
    'f4000001-0000-4000-8000-000000000003',
    'c1000001-0000-4000-8000-000000000005',
    'green',
    'Encaixe rotina',
    NULL,
    'waiting',
    'b2000001-0000-4000-8000-000000000003'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.waitlist_entries (
  id,
  patient_id,
  priority,
  reason,
  preferred_dentist_id,
  status,
  created_by
)
VALUES (
  'f4000001-0000-4000-8000-000000000004',
  'c1000001-0000-4000-8000-000000000006',
  'yellow',
  'Oferta demo',
  'a1000001-0000-4000-8000-000000000001',
  'offered',
  'b2000001-0000-4000-8000-000000000003'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.slot_offers (
  id,
  waitlist_entry_id,
  offered_at,
  ends_at,
  dentist_id,
  token_hash,
  expires_at,
  status,
  created_by
)
VALUES (
  'f4000002-0000-4000-8000-000000000001',
  'f4000001-0000-4000-8000-000000000004',
  now(),
  now() + interval '30 minutes',
  'a1000001-0000-4000-8000-000000000001',
  '98bd0a212868e9bad042b4141f4aa9db9aa029e79c6c5cd7fc039a409059383b',
  now() + interval '40 minutes',
  'pending',
  'b2000001-0000-4000-8000-000000000003'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.patients
SET
  lgpd_consent_at = now() - interval '15 days',
  updated_at = now()
WHERE id IN (
  'c1000001-0000-4000-8000-000000000003',
  'c1000001-0000-4000-8000-000000000004',
  'c1000001-0000-4000-8000-000000000005',
  'c1000001-0000-4000-8000-000000000006'
)
  AND lgpd_consent_at IS NULL;
