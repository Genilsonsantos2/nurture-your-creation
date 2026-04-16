
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum for movement types
CREATE TYPE public.movement_type AS ENUM ('entry', 'exit');

-- Enum for alert types
CREATE TYPE public.alert_type AS ENUM ('absent', 'not_returned', 'irregular_time', 'excessive_exits');

-- Enum for alert status
CREATE TYPE public.alert_status AS ENUM ('pending', 'resolved');

-- Enum for occurrence types
CREATE TYPE public.occurrence_type AS ENUM ('unauthorized_exit', 'guardian_pickup', 'student_sick', 'behavior', 'late', 'other');

-- Enum for schedule types
CREATE TYPE public.schedule_type AS ENUM ('entry', 'exit');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role_label TEXT DEFAULT 'FuncionÃ¡rio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  series TEXT NOT NULL,
  class TEXT NOT NULL,
  enrollment TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  exit_limit INTEGER DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  qr_code TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardians table
CREATE TABLE public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  callmebot_api_key TEXT,
  parent_access_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Movements table
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  type movement_type NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registered_by UUID REFERENCES auth.users(id)
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  type alert_type NOT NULL,
  message TEXT NOT NULL,
  status alert_status NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedules (time windows)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type schedule_type NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tolerance_minutes INTEGER DEFAULT 5,
  notify_whatsapp BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Occurrences table
CREATE TABLE public.occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  type occurrence_type NOT NULL,
  description TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table (single row)
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'CETINI - Nova Itarana',
  whatsapp_enabled BOOLEAN DEFAULT false,
  school_phone TEXT,
  callmebot_api_key_global TEXT,
  exit_limit_default INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (school_name) VALUES ('ColÃ©gio Estadual de Tempo Integral de Nova Itarana');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Anyone authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles: only readable
CREATE POLICY "Authenticated can read roles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Students: authenticated can CRUD
CREATE POLICY "Authenticated can read students"
  ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert students"
  ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update students"
  ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete students"
  ON public.students FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Guardians: authenticated can CRUD
CREATE POLICY "Authenticated can read guardians"
  ON public.guardians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert guardians"
  ON public.guardians FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update guardians"
  ON public.guardians FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete guardians"
  ON public.guardians FOR DELETE TO authenticated USING (true);

-- Movements: authenticated can read and insert
CREATE POLICY "Authenticated can read movements"
  ON public.movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert movements"
  ON public.movements FOR INSERT TO authenticated WITH CHECK (true);

-- Alerts: authenticated can read, update
CREATE POLICY "Authenticated can read alerts"
  ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert alerts"
  ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update alerts"
  ON public.alerts FOR UPDATE TO authenticated USING (true);

-- Schedules: authenticated can read, admins can manage
CREATE POLICY "Authenticated can read schedules"
  ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage schedules"
  ON public.schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Occurrences: authenticated can read and insert
CREATE POLICY "Authenticated can read occurrences"
  ON public.occurrences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert occurrences"
  ON public.occurrences FOR INSERT TO authenticated WITH CHECK (true);

-- Settings: authenticated can read, admins can update
CREATE POLICY "Authenticated can read settings"
  ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public access for parent portal (guardians token-based)
CREATE POLICY "Public can read guardians by token"
  ON public.guardians FOR SELECT TO anon
  USING (parent_access_token IS NOT NULL);

CREATE POLICY "Public can read students for parent portal"
  ON public.students FOR SELECT TO anon USING (true);

CREATE POLICY "Public can read movements for parent portal"
  ON public.movements FOR SELECT TO anon USING (true);

-- Enable realtime for movements
ALTER PUBLICATION supabase_realtime ADD TABLE public.movements;

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
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS modality text DEFAULT 'technical';

ALTER TYPE public.schedule_type ADD VALUE IF NOT EXISTS 'break';
UPDATE students SET series = '3Âª SÃ‰RIE' WHERE series NOT LIKE '3Âª%' AND series LIKE '3%' AND series LIKE '%RIE%';
UPDATE students SET series = '2Âª SÃ‰RIE' WHERE series NOT LIKE '2Âª%' AND series LIKE '2%' AND series LIKE '%RIE%';
UPDATE students SET series = '1Âª SÃ‰RIE' WHERE series NOT LIKE '1Âª%' AND series LIKE '1%' AND series LIKE '%RIE%';
UPDATE students SET name = REPLACE(name, 'ï¿½', '') WHERE name LIKE '%ï¿½%';
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

CREATE TABLE public.gate_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 day'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gate_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read announcements"
  ON public.gate_announcements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and Coordinators can manage announcements"
  ON public.gate_announcements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role));

-- Add document_url to absence_justifications
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_justifications' AND column_name='document_url') THEN
        ALTER TABLE public.absence_justifications ADD COLUMN document_url TEXT;
    END IF;
END $$;

-- Create storage bucket for justifications if not exists
-- Note: This requires the storage schema which is standard in Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('justifications', 'justifications', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Allow public uploads (to allow parents to upload without being logged into the admin dashboard)
CREATE POLICY "Public can upload justifications"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'justifications');

-- Allow authenticated users (coordinators) to read
CREATE POLICY "Coordinators can read justifications"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'justifications');

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
-- Migration: Add WhatsApp Evolution API settings
DO $$ 
BEGIN 
    -- 1. Add whatsapp_api_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_api_url') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_api_url TEXT;
    END IF;

    -- 2. Add whatsapp_api_key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_api_key') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_api_key TEXT;
    END IF;

    -- 3. Add whatsapp_instance_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_instance_name') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_instance_name TEXT;
    END IF;

    -- 4. Add whatsapp_bot_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_bot_type') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_bot_type TEXT DEFAULT 'manual'; -- 'manual' (wa.me) or 'evolution'
    END IF;
END $$;
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

-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated can upload medical docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-documents');

-- Allow authenticated users to read
CREATE POLICY "Authenticated can read medical docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medical-documents');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated can delete medical docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'medical-documents');
-- Migration: Add observation column to movements table
-- Description: Allows storing specific contextual information for exception-based gate tracking
-- (e.g., 'SaÃ­da no horÃ¡rio de almoÃ§o', 'SaÃ­da Institucional / Antecipada', 'Entrada (Atraso)')

ALTER TABLE IF EXISTS public.movements 
ADD COLUMN IF NOT EXISTS observation text;

-- Habilitar exclusÃ£o para administradores e coordenadores na tabela de alertas
CREATE POLICY "Admins and coordinators can delete alerts" ON public.alerts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coordinator')
  )
);

-- Habilitar exclusÃ£o para administradores e coordenadores na tabela de justificativas
CREATE POLICY "Admins and coordinators can delete justifications" ON public.absence_justifications
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coordinator')
  )
);

-- Adicionar coluna de observaÃ§Ã£o na tabela de movimentaÃ§Ãµes
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS observation TEXT;

-- Garantir que a coluna observation seja incluÃ­da no tipo Database do Supabase futuramente
COMMENT ON COLUMN public.movements.observation IS 'ObservaÃ§Ã£o automÃ¡tica sobre o tipo de movimentaÃ§Ã£o (ex: Retorno de Intervalo, Atraso)';

-- Migration: Add category to absence_justifications
-- Description: Group justifications by type (Health, Traffic, Family, etc)
ALTER TABLE public.absence_justifications 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Outros';

-- Add comment for context
COMMENT ON COLUMN public.absence_justifications.category IS 'Categoria da justificativa para anÃ¡lise estatÃ­stica (SaÃºde, TrÃ¢nsito, FamÃ­lia, Outros)';
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

COMMENT ON COLUMN public.movements.source_type IS 'Origem do registro: CrachÃ¡, Reconhecimento Facial ou Manual.';
/*
  # Auto-create profile on user signup

  1. Changes
    - Create trigger function to automatically create profile when new user signs up
    - Attach trigger to auth.users table
    - This ensures every user has a profile record with proper role assignment

  2. Security
    - Uses trigger to enforce data consistency
    - Profile inherits user email and metadata
    - Role defaults to 'FuncionÃ¡rio' as per existing setup
*/

-- Create function to auto-create profile
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role_label
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FuncionÃ¡rio'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create trigger
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();
-- Create the student-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for student-photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'student-photos' );

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'student-photos' );

CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'student-photos' );
-- Update Student Management Policy to include Coordinator
DROP POLICY IF EXISTS "Secretaries can manage students" ON public.students;
CREATE POLICY "Management roles can manage students"
  ON public.students FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary') OR 
    public.has_role(auth.uid(), 'director') OR 
    public.has_role(auth.uid(), 'coordinator')
  );

-- Update Guardians Management Policy
-- The initial migration had "Authenticated can insert guardians", but let's be explicit
DROP POLICY IF EXISTS "Authenticated can insert guardians" ON public.guardians;
DROP POLICY IF EXISTS "Authenticated can update guardians" ON public.guardians;
DROP POLICY IF EXISTS "Authenticated can delete guardians" ON public.guardians;

CREATE POLICY "Management roles can manage guardians"
  ON public.guardians FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary') OR 
    public.has_role(auth.uid(), 'director') OR 
    public.has_role(auth.uid(), 'coordinator')
  );

-- Update Occurrences Management Policy
DROP POLICY IF EXISTS "Secretaries and Directors can manage occurrences" ON public.occurrences;
CREATE POLICY "Management roles can manage occurrences"
  ON public.occurrences FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary') OR 
    public.has_role(auth.uid(), 'director') OR 
    public.has_role(auth.uid(), 'coordinator')
  );

-- Update Absence Justifications Management Policy
DROP POLICY IF EXISTS "Secretaries and Directors can manage justifications" ON public.absence_justifications;
CREATE POLICY "Management roles can manage justifications"
  ON public.absence_justifications FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary') OR 
    public.has_role(auth.uid(), 'director') OR 
    public.has_role(auth.uid(), 'coordinator')
  );
