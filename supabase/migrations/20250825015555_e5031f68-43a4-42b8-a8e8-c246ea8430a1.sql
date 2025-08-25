-- Adicionar política RLS para permitir que client_users vejam tickets atribuídos ao seu cliente
CREATE POLICY "Client users can view tickets assigned to their client" 
ON tickets 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND client_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM profiles p 
    JOIN clients c ON c.id = tickets.client_id 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_user'::user_role 
    AND p.company_id = c.company_id
    AND (
      -- O usuário client_user pode ver tickets do cliente se tiver o mesmo email
      p.email_contato = c.email
      OR 
      -- Ou se não tiver email_contato definido, permitir acesso baseado na empresa
      (p.email_contato IS NULL AND c.company_id = p.company_id)
    )
  )
);