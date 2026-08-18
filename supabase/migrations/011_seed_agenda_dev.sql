-- Seed de agenda: pacientes fictícios e consultas de exemplo (idempotente).

INSERT INTO public.patients (id, full_name, birth_date, cpf, contact_phone, contact_email)
VALUES
  (
    'c1000001-0000-4000-8000-000000000001',
    'Maria Silva',
    '1985-03-12',
    '11122233344',
    '11999990001',
    'maria.silva@example.com'
  ),
  (
    'c1000001-0000-4000-8000-000000000002',
    'João Santos',
    '1990-07-22',
    '22233344455',
    '11999990002',
    'joao.santos@example.com'
  ),
  (
    'c1000001-0000-4000-8000-000000000003',
    'Ana Oliveira',
    '1978-11-05',
    '33344455566',
    '11999990003',
    'ana.oliveira@example.com'
  ),
  (
    'c1000001-0000-4000-8000-000000000004',
    'Pedro Costa',
    '2001-01-18',
    '44455566677',
    '11999990004',
    'pedro.costa@example.com'
  ),
  (
    'c1000001-0000-4000-8000-000000000005',
    'Lucia Ferreira',
    '1965-09-30',
    '55566677788',
    '11999990005',
    'lucia.ferreira@example.com'
  ),
  (
    'c1000001-0000-4000-8000-000000000006',
    'Carlos Mendes',
    '1988-04-14',
    null,
    '11999990006',
    null
  )
ON CONFLICT (id) DO NOTHING;

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
VALUES
  (
    'd1000001-0000-4000-8000-000000000001',
    'c1000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    (current_date + time '09:00') AT TIME ZONE 'America/Sao_Paulo',
    (current_date + time '10:00') AT TIME ZONE 'America/Sao_Paulo',
    'confirmed',
    'Limpeza',
    'Primeira consulta do dia'
  ),
  (
    'd1000001-0000-4000-8000-000000000002',
    'c1000001-0000-4000-8000-000000000002',
    'a1000001-0000-4000-8000-000000000002',
    (current_date + time '10:30') AT TIME ZONE 'America/Sao_Paulo',
    (current_date + time '11:30') AT TIME ZONE 'America/Sao_Paulo',
    'scheduled',
    'Restauração',
    null
  ),
  (
    'd1000001-0000-4000-8000-000000000003',
    'c1000001-0000-4000-8000-000000000003',
    'a1000001-0000-4000-8000-000000000003',
    (current_date + time '14:00') AT TIME ZONE 'America/Sao_Paulo',
    (current_date + time '15:00') AT TIME ZONE 'America/Sao_Paulo',
    'scheduled',
    'Canal',
    null
  ),
  (
    'd1000001-0000-4000-8000-000000000004',
    'c1000001-0000-4000-8000-000000000004',
    'a1000001-0000-4000-8000-000000000001',
    (current_date + interval '1 day' + time '11:00') AT TIME ZONE 'America/Sao_Paulo',
    (current_date + interval '1 day' + time '12:00') AT TIME ZONE 'America/Sao_Paulo',
    'scheduled',
    'Avaliação',
    null
  ),
  (
    'd1000001-0000-4000-8000-000000000005',
    'c1000001-0000-4000-8000-000000000005',
    'a1000001-0000-4000-8000-000000000004',
    (current_date + interval '2 days' + time '08:30') AT TIME ZONE 'America/Sao_Paulo',
    (current_date + interval '2 days' + time '09:30') AT TIME ZONE 'America/Sao_Paulo',
    'confirmed',
    'Clareamento',
    null
  ),
  (
    'd1000001-0000-4000-8000-000000000006',
    'c1000001-0000-4000-8000-000000000006',
    'a1000001-0000-4000-8000-000000000005',
    (current_date - interval '1 day' + time '16:00') AT TIME ZONE 'America/Sao_Paulo',
    (current_date - interval '1 day' + time '17:00') AT TIME ZONE 'America/Sao_Paulo',
    'completed',
    'Extração',
    null
  )
ON CONFLICT (id) DO NOTHING;
