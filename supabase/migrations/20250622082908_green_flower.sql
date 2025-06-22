/*
  # Create blogimages storage bucket with policies

  1. Storage
    - Create 'blogimages' bucket for blog post images
  
  2. Security
    - Add public read access policy
    - Add authenticated user upload policy
    - Add owner-only update/delete policies
    
  Note: All policies use ON CONFLICT DO NOTHING to handle cases where policies already exist
*/

-- Create the blogimages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blogimages', 'blogimages', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the blogimages bucket with unique names
-- Allow public read access to all objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'blogimages_public_read'
  ) THEN
    CREATE POLICY "blogimages_public_read" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'blogimages');
  END IF;
END
$$;

-- Allow authenticated users to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'blogimages_auth_insert'
  ) THEN
    CREATE POLICY "blogimages_auth_insert" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'blogimages');
  END IF;
END
$$;

-- Allow users to update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'blogimages_auth_update'
  ) THEN
    CREATE POLICY "blogimages_auth_update" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'blogimages' AND auth.uid() = owner);
  END IF;
END
$$;

-- Allow users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'blogimages_auth_delete'
  ) THEN
    CREATE POLICY "blogimages_auth_delete" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'blogimages' AND auth.uid() = owner);
  END IF;
END
$$;