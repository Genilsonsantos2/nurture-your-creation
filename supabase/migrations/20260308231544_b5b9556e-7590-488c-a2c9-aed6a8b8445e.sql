
-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated can upload medical docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-documents');

-- Allow authenticated users to read
CREATE POLICY "Authenticated can read medical docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medical-documents');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated can delete medical docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'medical-documents');
