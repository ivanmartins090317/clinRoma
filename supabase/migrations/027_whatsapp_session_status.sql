-- F7-10: status persistido da sessão WhatsApp da clínica (piloto: default)

CREATE TABLE IF NOT EXISTS public.whatsapp_session_status (
  session_name text PRIMARY KEY,
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.whatsapp_session_status (session_name, status)
VALUES ('default', 'STOPPED')
ON CONFLICT (session_name) DO NOTHING;

ALTER TABLE public.whatsapp_session_status ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.whatsapp_session_status FROM PUBLIC;
REVOKE ALL ON public.whatsapp_session_status FROM anon;
REVOKE ALL ON public.whatsapp_session_status FROM authenticated;

GRANT SELECT ON public.whatsapp_session_status TO authenticated;

DROP POLICY IF EXISTS whatsapp_session_status_select ON public.whatsapp_session_status;
CREATE POLICY whatsapp_session_status_select ON public.whatsapp_session_status
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );
