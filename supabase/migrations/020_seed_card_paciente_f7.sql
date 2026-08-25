-- Seed F7-09: consulta concluída no passado da Maria, com nome de procedimento.
-- Idempotente. Não altera o seed da agenda do dia (011).

INSERT INTO public.appointments (
  id,
  patient_id,
  dentist_id,
  starts_at,
  ends_at,
  status,
  procedure_name,
  notes
)
VALUES (
  'd1000001-0000-4000-8000-000000000007',
  'c1000001-0000-4000-8000-000000000001',
  'a1000001-0000-4000-8000-000000000001',
  (current_date - interval '14 days' + time '10:00') AT TIME ZONE 'America/Sao_Paulo',
  (current_date - interval '14 days' + time '11:00') AT TIME ZONE 'America/Sao_Paulo',
  'completed',
  'Restauração',
  'Consulta concluída para o card do paciente'
)
ON CONFLICT (id) DO NOTHING;
