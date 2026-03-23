-- Migration: Create Exit Authorizations System
-- Path: c:/Users/Genilson/Documents/sistema ceti/nurture-your-creation/supabase/migrations/20260306133000_exit_authorizations.sql

CREATE TABLE IF NOT EXISTS public.exit_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    authorized_by UUID REFERENCES auth.users(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'authorized', -- 'authorized', 'used', 'revoked'
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '8 hours'), -- Valid for the day by default
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exit_authorizations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can read exit authorizations"
  ON public.exit_authorizations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordinators and Admins can manage exit authorizations"
  ON public.exit_authorizations FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coordinator')
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.exit_authorizations;

-- Index for performance in scans
CREATE INDEX IF NOT EXISTS idx_exit_auth_student_active ON public.exit_authorizations (student_id, status) WHERE status = 'authorized';
