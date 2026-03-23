
-- 1. Update app_role enum to include coordinator and gatekeeper
-- Note: Suboptimal way to add enum values in Postgres, but often safest in migrations
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gatekeeper';

-- 2. Create school_events table
CREATE TABLE IF NOT EXISTS public.school_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'event', -- 'event', 'holiday', 'recess', 'school_saturday'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Create absence_justifications table
CREATE TABLE IF NOT EXISTS public.absence_justifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    justification_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Update settings table to include system_active (already used in UI but confirming)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='system_active') THEN
        ALTER TABLE public.settings ADD COLUMN system_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_justifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for school_events
CREATE POLICY "Anyone authenticated can read events"
  ON public.school_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Coordinators can manage events"
  ON public.school_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));

-- 7. RLS Policies for absence_justifications
CREATE POLICY "Anyone authenticated can read justifications"
  ON public.absence_justifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public can insert justifications via token"
  ON public.absence_justifications FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Coordinators and Admins can update justifications"
  ON public.absence_justifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));

-- 8. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_justifications;
