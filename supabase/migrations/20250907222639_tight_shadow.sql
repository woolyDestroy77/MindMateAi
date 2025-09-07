/*
  # Add storage policies for message_attachments bucket

  1. Storage Policies
    - Allow authenticated users to insert (upload) files to message_attachments bucket
    - Allow authenticated users to select (download) files they uploaded
    - Allow authenticated users to delete files they uploaded

  2. Security
    - Users can only access their own uploaded files
    - Authenticated users only - no anonymous access
    - Proper file access control based on user ownership
*/

-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to message_attachments bucket
CREATE POLICY "Allow authenticated users to upload message attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to view/download their own uploaded files
CREATE POLICY "Allow users to view their own message attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own uploaded files
CREATE POLICY "Allow users to delete their own message attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own uploaded files
CREATE POLICY "Allow users to update their own message attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'message_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);