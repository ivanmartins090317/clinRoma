-- Corrige identities das contas seed para login via Supabase Auth

DO $$
DECLARE
  dev_password text := crypt('ClinRomaDev2026!', gen_salt('bf'));
BEGIN
  UPDATE auth.users
  SET
    aud = 'authenticated',
    role = 'authenticated',
    encrypted_password = dev_password,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = false,
    is_anonymous = false,
    raw_app_meta_data = COALESCE(
      raw_app_meta_data,
      '{"provider":"email","providers":["email"]}'::jsonb
    ),
    updated_at = now()
  WHERE email IN (
    'admin@clinroma.dev',
    'dentist@clinroma.dev',
    'reception@clinroma.dev',
    'assistant@clinroma.dev',
    'viewer@clinroma.dev'
  );

  DELETE FROM auth.identities
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'admin@clinroma.dev',
      'dentist@clinroma.dev',
      'reception@clinroma.dev',
      'assistant@clinroma.dev',
      'viewer@clinroma.dev'
    )
  );

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
  );
END $$;
