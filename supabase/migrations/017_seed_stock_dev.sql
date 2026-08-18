-- Seed de estoque para desenvolvimento (idempotente)

INSERT INTO public.supplies (
  id,
  name,
  unit,
  current_quantity,
  minimum_quantity
)
VALUES
  (
    'c5000001-0000-4000-8000-000000000001',
    'Luva nitrílica M',
    'unit',
    300,
    20
  ),
  (
    'c5000001-0000-4000-8000-000000000002',
    'Alginato',
    'box',
    500,
    10
  ),
  (
    'c5000001-0000-4000-8000-000000000003',
    'Babador',
    'roll',
    50,
    5
  ),
  (
    'c5000001-0000-4000-8000-000000000004',
    'Anestésico',
    'bottle',
    2,
    5
  ),
  (
    'c5000001-0000-4000-8000-000000000005',
    'Fio dental',
    'roll',
    30,
    3
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.supply_packages (
  id,
  supply_id,
  qr_code,
  quantity,
  remaining_quantity,
  lot_number,
  expires_at,
  status
)
VALUES
  (
    'd5000001-0000-4000-8000-000000000001',
    'c5000001-0000-4000-8000-000000000001',
    'CR-DEV001',
    100,
    100,
    'L2026-08',
    '2027-08-01',
    'active'
  ),
  (
    'd5000001-0000-4000-8000-000000000002',
    'c5000001-0000-4000-8000-000000000001',
    'CR-DEV002',
    100,
    100,
    'L2026-08',
    '2027-08-01',
    'active'
  ),
  (
    'd5000001-0000-4000-8000-000000000003',
    'c5000001-0000-4000-8000-000000000002',
    'CR-DEV003',
    500,
    500,
    'A2026-01',
    '2028-01-15',
    'active'
  )
ON CONFLICT (qr_code) DO NOTHING;
