/*
  # Create blogimages bucket and policies

  1. New Storage Bucket
    - Creates a public 'blogimages' bucket for blog post images
  
  2. Security Policies
    - Adds policies for public read access
    - Allows authenticated users to upload images
    - Allows users to update and delete their own images
*/

-- Create the blogimages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blogimages', 'blogimages', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the blogimages bucket
-- Allow public read access to all objects
CREATE POLICY "blogimages_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blogimages')
  ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "blogimages_auth_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blogimages')
  ON CONFLICT DO NOTHING;

-- Allow users to update and delete their own files
CREATE POLICY "blogimages_auth_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blogimages' AND auth.uid() = owner)
  ON CONFLICT DO NOTHING;

CREATE POLICY "blogimages_auth_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blogimages' AND auth.uid() = owner)
  ON CONFLICT DO NOTHING;