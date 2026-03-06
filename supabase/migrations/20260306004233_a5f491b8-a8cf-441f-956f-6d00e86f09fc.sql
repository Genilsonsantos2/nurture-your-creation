ALTER TABLE public.students ADD COLUMN IF NOT EXISTS modality text DEFAULT 'technical';

ALTER TYPE public.schedule_type ADD VALUE IF NOT EXISTS 'break';