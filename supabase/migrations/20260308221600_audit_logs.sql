-- 20260308221600_audit_logs.sql

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL, -- e.g., 'DELETE', 'UPDATE', 'CREATE'
    entity_name TEXT NOT NULL, -- e.g., 'students', 'settings', 'users'
    entity_id TEXT, -- The ID of the record that was affected
    user_id UUID REFERENCES auth.users(id), -- The user who performed the action
    details JSONB, -- Additional info (e.g., previous state vs new state)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Any authenticated user can insert logs (front-end utility will use this)
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
