
-- Create table for storing student face descriptors (encodings)
CREATE TABLE IF NOT EXISTS public.student_face_encodings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    encoding JSONB NOT NULL, -- Array of 128 floating point numbers
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for encodings
ALTER TABLE public.student_face_encodings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to encodings"
ON public.student_face_encodings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create table for face recognition events (audit)
CREATE TABLE IF NOT EXISTS public.face_recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    camera_name TEXT,
    similarity_score FLOAT,
    image_url TEXT, -- Path to the captured face snapshot
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for logs
ALTER TABLE public.face_recognition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to face logs"
ON public.face_recognition_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add source_type to movements to distinguish between QR/Badge and Facial Recognition
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='movements' AND COLUMN_NAME='source_type') THEN
        ALTER TABLE public.movements ADD COLUMN source_type TEXT DEFAULT 'badge' CHECK (source_type IN ('badge', 'face', 'manual'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='movements' AND COLUMN_NAME='camera_id') THEN
        ALTER TABLE public.movements ADD COLUMN camera_id TEXT;
    END IF;
END $$;

COMMENT ON COLUMN public.movements.source_type IS 'Origem do registro: Crachá, Reconhecimento Facial ou Manual.';
