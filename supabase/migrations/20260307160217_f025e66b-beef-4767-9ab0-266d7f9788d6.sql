
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
