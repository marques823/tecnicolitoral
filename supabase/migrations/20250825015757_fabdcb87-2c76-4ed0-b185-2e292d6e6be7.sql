-- Remover política muito permissiva
DROP POLICY IF EXISTS "Client users can view tickets assigned to their client" ON tickets;

-- Criar política mais específica que vincula client_user ao cliente através do email
CREATE POLICY "Client users can view tickets assigned to their specific client" 
ON tickets 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND client_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN clients c ON c.email = COALESCE(p.email_contato, (SELECT email FROM auth.users WHERE id = p.user_id))
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_user'::user_role 
    AND c.id = tickets.client_id
    AND c.company_id = p.company_id
  )
);