-- Atualizar política RLS para permitir que client_users criem registros na tabela clients
DROP POLICY IF EXISTS "Users can create client records for their company" ON clients;

CREATE POLICY "Users can create client records for their company" 
ON clients 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id(auth.uid()));