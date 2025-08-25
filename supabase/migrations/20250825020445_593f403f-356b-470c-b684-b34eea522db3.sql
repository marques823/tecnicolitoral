-- Corrigir políticas RLS para evitar mostrar tickets de clientes sem login

-- 1. Remover política muito ampla que mostra tickets de clientes sem login
DROP POLICY IF EXISTS "Users can view tickets from their company" ON tickets;

-- 2. Adicionar política específica para masters e técnicos
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

-- 3. Adicionar WITH CHECK para a política de UPDATE
DROP POLICY IF EXISTS "Company admins and technicians can update tickets" ON tickets;

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