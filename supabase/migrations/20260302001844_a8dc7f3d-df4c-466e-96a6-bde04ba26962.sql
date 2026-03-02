
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
  role_label TEXT DEFAULT 'Funcionário',
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
INSERT INTO public.settings (school_name) VALUES ('Colégio Estadual de Tempo Integral de Nova Itarana');

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
