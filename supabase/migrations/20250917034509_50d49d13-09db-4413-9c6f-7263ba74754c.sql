-- Corrigir política RLS para update de tickets permitindo que client_user atualize apenas título e descrição
DROP POLICY IF EXISTS "Client users can update their own tickets" ON public.tickets;

-- Nova política mais específica para client_user
CREATE POLICY "Client users can update basic info of their own tickets" 
ON public.tickets 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'client_user'
  )
) 
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND created_by = auth.uid()
);

-- Garantir que a política para admins e técnicos está correta
DROP POLICY IF EXISTS "Company admins and technicians can update tickets" ON public.tickets;

CREATE POLICY "Company admins and technicians can update tickets" 
ON public.tickets 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'technician')
  )
) 
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
);