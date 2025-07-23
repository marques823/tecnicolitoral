-- Adicionar política de INSERT para ticket_history
DROP POLICY IF EXISTS "Users can insert ticket history" ON public.ticket_history;
CREATE POLICY "Users can insert ticket history" 
ON public.ticket_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = ticket_history.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

-- Testar se o trigger está funcionando - inserir histórico manual para um ticket existente
DO $$
DECLARE
    first_ticket_id UUID;
    test_user_id UUID := '773dc17f-1ac2-4f13-88e1-c422d0de84ab';
BEGIN
    -- Pegar o primeiro ticket disponível
    SELECT id INTO first_ticket_id FROM tickets LIMIT 1;
    
    IF first_ticket_id IS NOT NULL THEN
        -- Inserir um registro de histórico manualmente para teste
        INSERT INTO ticket_history (ticket_id, user_id, action, description)
        VALUES (first_ticket_id, test_user_id, 'created', 'Ticket criado (teste manual)');
    END IF;
END $$;