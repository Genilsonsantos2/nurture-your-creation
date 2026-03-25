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
