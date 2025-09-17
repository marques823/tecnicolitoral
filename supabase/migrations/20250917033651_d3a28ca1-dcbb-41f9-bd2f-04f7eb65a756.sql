-- Remover política antiga que permite todos os usuários inserir comentários
DROP POLICY IF EXISTS "Users can insert comments for their company tickets" ON public.ticket_comments;

-- Criar política que permite apenas técnicos e admins inserir comentários
CREATE POLICY "Only technicians and admins can insert comments" 
ON public.ticket_comments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM tickets t
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE t.id = ticket_comments.ticket_id 
      AND t.company_id = get_user_company_id(auth.uid())
      AND p.role IN ('technician', 'company_admin')
  ) 
  AND user_id = auth.uid()
);