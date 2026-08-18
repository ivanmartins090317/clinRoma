-- Buckets privados de armazenamento e políticas por papel

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('record-photos', 'record-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('record-audio', 'record-audio', false, 52428800, ARRAY['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/wav']),
  ('supply-sheets', 'supply-sheets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('supply-labels', 'supply-labels', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY record_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'record-photos'
    AND public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY record_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'record-photos'
    AND public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY record_audio_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'record-audio'
    AND public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY record_audio_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'record-audio'
    AND public.has_any_role(ARRAY['admin', 'dentist', 'reception']::public.user_role[])
  );

CREATE POLICY supply_sheets_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'supply-sheets'
    AND public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'room_assistant'
    ]::public.user_role[])
  );

CREATE POLICY supply_sheets_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'supply-sheets'
    AND public.has_any_role(ARRAY['admin']::public.user_role[])
  );

CREATE POLICY supply_labels_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'supply-labels'
    AND public.has_any_role(ARRAY[
      'admin', 'dentist', 'reception', 'room_assistant'
    ]::public.user_role[])
  );

CREATE POLICY supply_labels_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'supply-labels'
    AND public.has_any_role(ARRAY['admin', 'room_assistant']::public.user_role[])
  );
