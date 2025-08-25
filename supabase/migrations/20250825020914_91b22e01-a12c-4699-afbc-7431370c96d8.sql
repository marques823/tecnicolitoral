-- Adicionar política para client_users editarem seus próprios tickets
CREATE POLICY "Client users can update their own tickets" 
ON tickets 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'client_user'
  )
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND created_by = auth.uid()
);