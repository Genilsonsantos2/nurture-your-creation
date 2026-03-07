-- Migration for Gate Announcements table

CREATE TABLE IF NOT EXISTS public.gate_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.gate_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.gate_announcements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.gate_announcements FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Enable update for creators and admins" ON public.gate_announcements FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinator')));
CREATE POLICY "Enable delete for creators and admins" ON public.gate_announcements FOR DELETE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gate_announcements_updated_at
BEFORE UPDATE ON public.gate_announcements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
