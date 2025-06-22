/*
  # Create blogimages storage bucket

  1. New Storage Bucket
    - Creates a public 'blogimages' bucket for storing blog post images
  
  2. Security
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
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blogimages');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blogimages');

-- Allow users to update and delete their own files
CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blogimages' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blogimages' AND auth.uid() = owner);