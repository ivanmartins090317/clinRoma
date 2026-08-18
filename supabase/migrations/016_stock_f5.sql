-- Fase 5: quantidade restante em pacotes, trigger de saldo e constraints

ALTER TABLE public.supply_packages
  ADD COLUMN IF NOT EXISTS remaining_quantity numeric(12, 2);

UPDATE public.supply_packages
SET remaining_quantity = quantity
WHERE remaining_quantity IS NULL;

ALTER TABLE public.supply_packages
  ALTER COLUMN remaining_quantity SET NOT NULL;

ALTER TABLE public.supply_packages
  DROP CONSTRAINT IF EXISTS supply_packages_remaining_check;

ALTER TABLE public.supply_packages
  ADD CONSTRAINT supply_packages_remaining_check
  CHECK (remaining_quantity >= 0 AND remaining_quantity <= quantity);

ALTER TABLE public.supply_movements
  ADD COLUMN IF NOT EXISTS adjustment_direction text;

ALTER TABLE public.supply_movements
  DROP CONSTRAINT IF EXISTS supply_movements_adjustment_direction_check;

ALTER TABLE public.supply_movements
  ADD CONSTRAINT supply_movements_adjustment_direction_check
  CHECK (
    adjustment_direction IS NULL
    OR adjustment_direction IN ('increase', 'decrease')
  );

CREATE OR REPLACE FUNCTION public.apply_supply_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg record;
  supply_qty numeric(12, 2);
  new_remaining numeric(12, 2);
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.supplies
    SET
      current_quantity = current_quantity + NEW.quantity,
      updated_at = now()
    WHERE id = NEW.supply_id;

    IF NEW.package_id IS NOT NULL THEN
      UPDATE public.supply_packages
      SET
        remaining_quantity = remaining_quantity + NEW.quantity,
        status = 'active'::public.supply_package_status,
        updated_at = now()
      WHERE id = NEW.package_id;
    END IF;

  ELSIF NEW.movement_type = 'out' THEN
    SELECT current_quantity INTO supply_qty
    FROM public.supplies
    WHERE id = NEW.supply_id
    FOR UPDATE;

    IF supply_qty IS NULL OR supply_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente';
    END IF;

    UPDATE public.supplies
    SET
      current_quantity = current_quantity - NEW.quantity,
      updated_at = now()
    WHERE id = NEW.supply_id;

    IF NEW.package_id IS NOT NULL THEN
      SELECT * INTO pkg
      FROM public.supply_packages
      WHERE id = NEW.package_id
      FOR UPDATE;

      IF pkg IS NULL OR pkg.remaining_quantity < NEW.quantity THEN
        RAISE EXCEPTION 'Quantidade indisponível no pacote';
      END IF;

      new_remaining := pkg.remaining_quantity - NEW.quantity;

      UPDATE public.supply_packages
      SET
        remaining_quantity = new_remaining,
        status = CASE
          WHEN new_remaining = 0 THEN 'depleted'::public.supply_package_status
          ELSE status
        END,
        updated_at = now()
      WHERE id = NEW.package_id;
    END IF;

  ELSIF NEW.movement_type = 'adjustment' THEN
    IF NEW.adjustment_direction IS NULL THEN
      RAISE EXCEPTION 'Direção do ajuste obrigatória';
    END IF;

    IF NEW.package_id IS NOT NULL THEN
      RAISE EXCEPTION 'Ajuste não pode estar vinculado a pacote';
    END IF;

    IF NEW.adjustment_direction = 'increase' THEN
      UPDATE public.supplies
      SET
        current_quantity = current_quantity + NEW.quantity,
        updated_at = now()
      WHERE id = NEW.supply_id;
    ELSE
      SELECT current_quantity INTO supply_qty
      FROM public.supplies
      WHERE id = NEW.supply_id
      FOR UPDATE;

      IF supply_qty IS NULL OR supply_qty < NEW.quantity THEN
        RAISE EXCEPTION 'Saldo insuficiente para ajuste';
      END IF;

      UPDATE public.supplies
      SET
        current_quantity = current_quantity - NEW.quantity,
        updated_at = now()
      WHERE id = NEW.supply_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_supply_movement ON public.supply_movements;

CREATE TRIGGER trg_apply_supply_movement
  AFTER INSERT ON public.supply_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_supply_movement();

CREATE INDEX IF NOT EXISTS idx_supply_packages_qr_code
  ON public.supply_packages (qr_code);
