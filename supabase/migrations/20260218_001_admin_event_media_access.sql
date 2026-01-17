-- Add admin bypass policies for event-media storage bucket
-- Allows admins to upload/update/delete event media for any event

-- Allow admins to upload media to any event folder
CREATE POLICY "Admin can upload event media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-media' AND
  is_admin()
);

-- Allow admins to update any event media
CREATE POLICY "Admin can update event media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-media' AND
  is_admin()
)
WITH CHECK (
  bucket_id = 'event-media' AND
  is_admin()
);

-- Allow admins to delete any event media
CREATE POLICY "Admin can delete event media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-media' AND
  is_admin()
);
