-- Identidade: perfis de colaborador e dentistas clínicos

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'dentist',
  'reception',
  'room_assistant',
  'viewer'
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'viewer',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dentists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  cro text,
  calendar_color text NOT NULL DEFAULT '#6B2737',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dentists_profile_id ON public.dentists (profile_id);
CREATE INDEX idx_dentists_active ON public.dentists (active) WHERE active = true;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid() AND active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(allowed public.user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND active = true
      AND role = ANY (allowed)
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'viewer'),
    COALESCE((NEW.raw_user_meta_data ->> 'active')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_any_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY profiles_select_admin ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY dentists_select ON public.dentists
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'viewer'
    ]::public.user_role[])
  );

CREATE POLICY dentists_write ON public.dentists
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin', 'reception']::public.user_role[]));

GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dentists TO authenticated;
