-- 1. Create student_achievements table
CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL, -- 'perfect_attendance', 'most_improved', 'streak'
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create meal_logs table
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'lunch', -- 'breakfast', 'lunch', 'snack'
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    registered_by UUID REFERENCES auth.users(id)
);

-- 3. Add medical_critical_info and goal_progress to students table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='medical_critical_info') THEN
        ALTER TABLE public.students ADD COLUMN medical_critical_info TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='goal_progress') THEN
        ALTER TABLE public.students ADD COLUMN goal_progress INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Authenticated can read achievements"
  ON public.student_achievements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.student_achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read meal logs"
  ON public.meal_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gatekeepers and Admins can manage meal logs"
  ON public.meal_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gatekeeper'));

-- 6. Public access for achievements (Parent Portal)
CREATE POLICY "Public can read achievements via student"
  ON public.student_achievements FOR SELECT TO anon USING (true);

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;
