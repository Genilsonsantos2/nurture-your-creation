
-- Add medical and photo columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Create storage bucket for student photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for student-photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'student-photos' );

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );
