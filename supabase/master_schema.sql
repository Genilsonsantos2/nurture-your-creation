-- ##############################################################################
-- # CETI Digital - MASTER DATABASE SCHEMA
-- # Consolidated on 2026-03-25
-- ##############################################################################

-- [OPTIONAL] Clear existing schema for a fresh start
-- DROP SCHEMA public CASCADE; 
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO anon;
-- GRANT ALL ON SCHEMA public TO authenticated;
-- GRANT ALL ON SCHEMA public TO service_role;

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'coordinator', 'gatekeeper', 'secretary', 'director');
CREATE TYPE public.movement_type AS ENUM ('entry', 'exit');
CREATE TYPE public.alert_type AS ENUM ('absent', 'not_returned', 'irregular_time', 'excessive_exits');
CREATE TYPE public.alert_status AS ENUM ('pending', 'resolved');
CREATE TYPE public.occurrence_type AS ENUM ('unauthorized_exit', 'guardian_pickup', 'student_sick', 'behavior', 'late', 'other');
CREATE TYPE public.schedule_type AS ENUM ('entry', 'exit', 'break');

-- 2. CORE TABLES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    role_label TEXT DEFAULT 'Funcionário',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

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
    modality TEXT DEFAULT 'technical',
    blood_type TEXT,
    allergies TEXT,
    medical_notes TEXT,
    medical_critical_info TEXT,
    goal_progress INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE public.movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    type movement_type NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    registered_by UUID REFERENCES auth.users(id),
    observation TEXT,
    source_type TEXT DEFAULT 'badge' CHECK (source_type IN ('badge', 'face', 'manual')),
    camera_id TEXT
);

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

CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type schedule_type NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    tolerance_minutes INTEGER DEFAULT 5,
    notify_whatsapp BOOLEAN DEFAULT true,
    target_classes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    type occurrence_type NOT NULL,
    description TEXT,
    registered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.absence_justifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    justification_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', 
    category TEXT,
    attachment_url TEXT,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL DEFAULT 'CETI - Nova Itarana',
    whatsapp_enabled BOOLEAN DEFAULT false,
    school_phone TEXT,
    whatsapp_api_url TEXT,
    whatsapp_api_key TEXT,
    whatsapp_instance_name TEXT,
    whatsapp_bot_type TEXT DEFAULT 'manual',
    exit_limit_default INTEGER DEFAULT 3,
    system_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ADVANCED INTELLIGENCE TABLES
CREATE TABLE public.student_face_encodings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    encoding JSONB NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id)
);

CREATE TABLE public.face_recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    camera_name TEXT,
    similarity_score FLOAT,
    image_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gate_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exit_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    authorized_by UUID REFERENCES auth.users(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'authorized',
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '8 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role_label)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'Funcionário')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- 5. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_face_encodings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_recognition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_authorizations ENABLE ROW LEVEL SECURITY;

-- Management Policy for multiple roles
CREATE POLICY "Management roles can manage students" ON public.students FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'coordinator'));

CREATE POLICY "Management roles can manage guardians" ON public.guardians FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'coordinator'));

CREATE POLICY "Anyone authenticated can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can read guardians" ON public.guardians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can read movements" ON public.movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can insert movements" ON public.movements FOR INSERT TO authenticated WITH CHECK (true);

-- 6. STORAGE SETUP
-- Run this in Supabase Storage SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Simplified)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'student-photos' );
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'student-photos' );

-- 7. INITIAL DATA
INSERT INTO public.settings (school_name) VALUES ('Colégio Estadual de Tempo Integral de Nova Itarana') ON CONFLICT DO NOTHING;
