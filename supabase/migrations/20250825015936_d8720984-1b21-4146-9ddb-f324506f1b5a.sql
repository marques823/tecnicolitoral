-- Remover política problemática
DROP POLICY IF EXISTS "Client users can view tickets assigned to their specific client" ON tickets;

-- Criar função security definer para obter email do usuário
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$;

-- Recriar política usando a função
CREATE POLICY "Client users can view tickets assigned to their specific client" 
ON tickets 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND client_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN clients c ON c.email = COALESCE(p.email_contato, get_user_email(p.user_id))
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_user'::user_role 
    AND c.id = tickets.client_id
    AND c.company_id = p.company_id
  )
);