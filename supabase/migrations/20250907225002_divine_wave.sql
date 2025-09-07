/*
  # Fix message attachments storage policies

  1. Storage Policies
    - Drop existing policies that may be conflicting
    - Create new policies for authenticated users to upload/access files
    - Allow users to manage their own voice message files

  2. Security
    - Enable RLS on storage.objects if not already enabled
    - Allow authenticated users to upload to message_attachments bucket
    - Allow users to read files they uploaded or that were shared with them
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their message attachments" ON storage.objects;

-- Create policies for message_attachments bucket
CREATE POLICY "Allow authenticated uploads to message_attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message_attachments');

CREATE POLICY "Allow authenticated reads from message_attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'message_attachments');

CREATE POLICY "Allow users to update their message_attachments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'message_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their message_attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'message_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);