-- F7-06: aviso de estoque baixo para o financeiro (e-mail)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'stock_finance_alert_status'
  ) THEN
    CREATE TYPE public.stock_finance_alert_status AS ENUM (
      'pending',
      'sent',
      'failed',
      'cancelled'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.stock_finance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL REFERENCES public.supplies (id) ON DELETE CASCADE,
  current_quantity numeric(12, 2) NOT NULL,
  minimum_quantity numeric(12, 2) NOT NULL,
  status public.stock_finance_alert_status NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  sent_at timestamptz,
  episode_closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_finance_alerts_supply
  ON public.stock_finance_alerts (supply_id);

CREATE INDEX IF NOT EXISTS idx_stock_finance_alerts_pending_retry
  ON public.stock_finance_alerts (status, next_attempt_at)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_finance_alerts_open_episode
  ON public.stock_finance_alerts (supply_id)
  WHERE episode_closed_at IS NULL;

ALTER TABLE public.stock_finance_alerts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.stock_finance_alerts FROM PUBLIC;
REVOKE ALL ON public.stock_finance_alerts FROM anon;
REVOKE ALL ON public.stock_finance_alerts FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON public.stock_finance_alerts TO service_role;
