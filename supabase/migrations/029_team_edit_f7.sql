-- F7-11b: edição da equipe (recepção lista profiles; só admin altera role/active)

-- Recepção precisa listar colaboradores; UPDATE de role/active continua só admin.
DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
DROP POLICY IF EXISTS profiles_team_select ON public.profiles;

CREATE POLICY profiles_team_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'reception']::public.user_role[])
  );

-- Defesa em profundidade: não-admin autenticado não muda role/active.
-- service_role (auth.uid() nulo) segue permitido para provisionamento.
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

  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'Você não pode alterar seu próprio papel ou acesso';
    END IF;

    IF NOT public.has_any_role(ARRAY['admin']::public.user_role[]) THEN
      RAISE EXCEPTION 'Sem permissão para alterar papel ou acesso';
    END IF;
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
