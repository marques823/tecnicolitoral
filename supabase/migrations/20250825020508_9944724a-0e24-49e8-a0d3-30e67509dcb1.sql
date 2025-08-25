-- Verificar e corrigir políticas existentes
DROP POLICY IF EXISTS "Masters and technicians can view all company tickets" ON tickets;
DROP POLICY IF EXISTS "Company admins and technicians can update tickets" ON tickets;

-- Recriar políticas corretas
CREATE POLICY "Masters and technicians can view all company tickets" 
ON tickets 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'technician')
  )
);

CREATE POLICY "Company admins and technicians can update tickets" 
ON tickets 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'technician')
  )
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
);