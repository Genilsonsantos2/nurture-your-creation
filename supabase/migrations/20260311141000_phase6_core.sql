-- 1. Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';

-- 2. Create WhatsApp logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add target_classes to schedules for class-specific rules
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='target_classes') THEN
        ALTER TABLE public.schedules ADD COLUMN target_classes JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 4. Enable RLS on new table
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for whatsapp_logs
CREATE POLICY "Authenticated can read logs"
  ON public.whatsapp_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Directors can manage logs"
  ON public.whatsapp_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'director'));

-- 6. Update existing RLS policies to include new roles
-- Students
CREATE POLICY "Secretaries can manage students"
  ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'director'));

-- Justifications
CREATE POLICY "Secretaries and Directors can manage justifications"
  ON public.absence_justifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'director'));

-- Occurrences
CREATE POLICY "Secretaries and Directors can manage occurrences"
  ON public.occurrences FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'director'));

-- 7. Enable Realtime for logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_logs;
