-- Lembretes pós-consulta e registro de auditoria

CREATE TYPE public.reminder_channel AS ENUM ('email', 'whatsapp');
CREATE TYPE public.reminder_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments (id) ON DELETE CASCADE,
  dentist_id uuid NOT NULL REFERENCES public.dentists (id) ON DELETE RESTRICT,
  channel public.reminder_channel NOT NULL DEFAULT 'email',
  status public.reminder_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_appointment ON public.reminders (appointment_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log (actor_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY reminders_select ON public.reminders
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY reminders_write ON public.reminders
  FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.has_any_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_any_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY audit_log_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user()
    AND (actor_id IS NULL OR actor_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
