-- Seed de desenvolvimento (idempotente). Somente dados de piloto Neo Roma.

-- Cinco dentistas clínicos (podem existir sem login)
INSERT INTO public.dentists (id, full_name, cro, calendar_color, active)
VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Dr. Felipe Roma', 'CRO-SP 12345', '#6B2737', true),
  ('a1000001-0000-4000-8000-000000000002', 'Dra. Ana Silva', 'CRO-SP 23456', '#3D7A5C', true),
  ('a1000001-0000-4000-8000-000000000003', 'Dr. Bruno Costa', 'CRO-SP 34567', '#D4A017', true),
  ('a1000001-0000-4000-8000-000000000004', 'Dra. Carla Mendes', 'CRO-SP 45678', '#4A6FA5', true),
  ('a1000001-0000-4000-8000-000000000005', 'Dr. Diego Alves', 'CRO-SP 56789', '#8B4513', true)
ON CONFLICT (id) DO NOTHING;

-- Contas de teste (senha comum de dev: ClinRomaDev2026!)
-- Hash gerado com crypt('ClinRomaDev2026!', gen_salt('bf'))

DO $$
DECLARE
  dev_password text := crypt('ClinRomaDev2026!', gen_salt('bf'));
  user_admin uuid := 'b2000001-0000-4000-8000-000000000001';
  user_dentist uuid := 'b2000001-0000-4000-8000-000000000002';
  user_reception uuid := 'b2000001-0000-4000-8000-000000000003';
  user_assistant uuid := 'b2000001-0000-4000-8000-000000000004';
  user_viewer uuid := 'b2000001-0000-4000-8000-000000000005';
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      user_admin,
      'authenticated',
      'authenticated',
      'admin@clinroma.dev',
      dev_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Admin Piloto","role":"admin","active":true}'::jsonb,
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_dentist,
      'authenticated',
      'authenticated',
      'dentist@clinroma.dev',
      dev_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Dr. Felipe Roma","role":"dentist","active":true}'::jsonb,
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_reception,
      'authenticated',
      'authenticated',
      'reception@clinroma.dev',
      dev_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Recepção Neo Roma","role":"reception","active":true}'::jsonb,
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_assistant,
      'authenticated',
      'authenticated',
      'assistant@clinroma.dev',
      dev_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Auxiliar de Sala","role":"room_assistant","active":true}'::jsonb,
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      user_viewer,
      'authenticated',
      'authenticated',
      'viewer@clinroma.dev',
      dev_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Visualizador","role":"viewer","active":true}'::jsonb,
      now(),
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    u.id::text,
    u.id,
    jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  FROM auth.users u
  WHERE u.email IN (
    'admin@clinroma.dev',
    'dentist@clinroma.dev',
    'reception@clinroma.dev',
    'assistant@clinroma.dev',
    'viewer@clinroma.dev'
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO public.profiles (id, display_name, role, active)
  VALUES
    (user_admin, 'Admin Piloto', 'admin', true),
    (user_dentist, 'Dr. Felipe Roma', 'dentist', true),
    (user_reception, 'Recepção Neo Roma', 'reception', true),
    (user_assistant, 'Auxiliar de Sala', 'room_assistant', true),
    (user_viewer, 'Visualizador', 'viewer', true)
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      active = EXCLUDED.active;

  UPDATE public.dentists
  SET profile_id = user_dentist
  WHERE id = 'a1000001-0000-4000-8000-000000000001';
END $$;
