-- F7-11: gestão de acessos pelo admin (módulo Equipe)
-- Papel nunca vem do metadata do signup; admin atualiza profiles com travas no banco.

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
    'viewer',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- A política antiga era FOR ALL, o que sugeria INSERT/DELETE fora do escopo do módulo.
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;

DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]));

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin']::public.user_role[]));

-- O remoto pode ter GRANT UPDATE na tabela inteira (drift): grant por coluna não substitui.
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE INSERT, DELETE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, role, active) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_changed boolean := NEW.role IS DISTINCT FROM OLD.role;
  active_changed boolean := NEW.active IS DISTINCT FROM OLD.active;
  remaining_admins integer;
BEGIN
  NEW.updated_at := now();

  IF NOT role_changed AND NOT active_changed THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Você não pode alterar seu próprio papel ou acesso';
  END IF;

  IF OLD.role = 'admin' AND OLD.active = true
     AND (NEW.role <> 'admin' OR NEW.active = false) THEN
    SELECT count(*) INTO remaining_admins
    FROM public.profiles
    WHERE role = 'admin' AND active = true AND id <> OLD.id;

    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'A clínica precisa de pelo menos um administrador ativo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_update_guard ON public.profiles;
CREATE TRIGGER on_profile_update_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_update();
