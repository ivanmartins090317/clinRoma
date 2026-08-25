-- F7-07: segundo telefone opcional no cadastro (parente / paciente sem WhatsApp)

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS secondary_phone text;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS secondary_phone_note text;
