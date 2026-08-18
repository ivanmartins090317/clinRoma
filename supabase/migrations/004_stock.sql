-- Estoque: insumos, pacotes QR, movimentações e planilhas

CREATE TYPE public.supply_unit AS ENUM ('unit', 'box', 'roll', 'bottle');
CREATE TYPE public.supply_movement_type AS ENUM ('in', 'out', 'adjustment');
CREATE TYPE public.supply_package_status AS ENUM ('active', 'depleted', 'expired');

CREATE TABLE public.supplies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit public.supply_unit NOT NULL DEFAULT 'unit',
  current_quantity numeric(12, 2) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  minimum_quantity numeric(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supply_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL REFERENCES public.supplies (id) ON DELETE CASCADE,
  qr_code text NOT NULL,
  quantity numeric(12, 2) NOT NULL CHECK (quantity > 0),
  lot_number text,
  expires_at date,
  status public.supply_package_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supply_packages_qr_unique UNIQUE (qr_code)
);

CREATE TABLE public.supply_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL REFERENCES public.supplies (id) ON DELETE RESTRICT,
  package_id uuid REFERENCES public.supply_packages (id) ON DELETE SET NULL,
  movement_type public.supply_movement_type NOT NULL,
  quantity numeric(12, 2) NOT NULL CHECK (quantity > 0),
  performed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supply_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_supply_packages_supply ON public.supply_packages (supply_id);
CREATE INDEX idx_supply_movements_supply ON public.supply_movements (supply_id);

ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplies_select ON public.supplies
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'room_assistant'
    ]::public.user_role[])
  );

CREATE POLICY supplies_write ON public.supplies
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY supply_packages_select ON public.supply_packages
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'room_assistant'
    ]::public.user_role[])
  );

CREATE POLICY supply_packages_write ON public.supply_packages
  FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'room_assistant']::public.user_role[])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'room_assistant']::public.user_role[])
  );

CREATE POLICY supply_movements_select ON public.supply_movements
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'room_assistant'
    ]::public.user_role[])
  );

CREATE POLICY supply_movements_write ON public.supply_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'room_assistant']::public.user_role[])
  );

CREATE POLICY supply_sheets_select ON public.supply_sheets
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'room_assistant'
    ]::public.user_role[])
  );

CREATE POLICY supply_sheets_write ON public.supply_sheets
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin']::public.user_role[]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_packages TO authenticated;
GRANT SELECT, INSERT ON public.supply_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_sheets TO authenticated;
