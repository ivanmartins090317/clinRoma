-- Apagar insumo leva o histórico de movimentações junto.
-- Pacotes e alertas financeiros já caem em cascata.

ALTER TABLE public.supply_movements
  DROP CONSTRAINT IF EXISTS supply_movements_supply_id_fkey;

ALTER TABLE public.supply_movements
  ADD CONSTRAINT supply_movements_supply_id_fkey
  FOREIGN KEY (supply_id)
  REFERENCES public.supplies (id)
  ON DELETE CASCADE;

DROP POLICY IF EXISTS supply_movements_delete ON public.supply_movements;

CREATE POLICY supply_movements_delete ON public.supply_movements
  FOR DELETE TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]));

GRANT DELETE ON public.supply_movements TO authenticated;
