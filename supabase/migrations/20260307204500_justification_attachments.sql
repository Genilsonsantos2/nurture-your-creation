
-- Add document_url to absence_justifications
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_justifications' AND column_name='document_url') THEN
        ALTER TABLE public.absence_justifications ADD COLUMN document_url TEXT;
    END IF;
END $$;

-- Create storage bucket for justifications if not exists
-- Note: This requires the storage schema which is standard in Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('justifications', 'justifications', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Allow public uploads (to allow parents to upload without being logged into the admin dashboard)
CREATE POLICY "Public can upload justifications"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'justifications');

-- Allow authenticated users (coordinators) to read
CREATE POLICY "Coordinators can read justifications"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'justifications');
