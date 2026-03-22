
-- Habilitar exclusão para administradores e coordenadores na tabela de alertas
CREATE POLICY "Admins and coordinators can delete alerts" ON public.alerts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coordinator')
  )
);

-- Habilitar exclusão para administradores e coordenadores na tabela de justificativas
CREATE POLICY "Admins and coordinators can delete justifications" ON public.absence_justifications
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coordinator')
  )
);
