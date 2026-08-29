-- Oferta da fila por WhatsApp: purpose retryável no cron process-patient-messages

ALTER TYPE public.patient_message_purpose ADD VALUE IF NOT EXISTS 'slot_offer';
