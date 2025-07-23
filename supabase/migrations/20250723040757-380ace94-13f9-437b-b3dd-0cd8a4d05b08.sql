-- Remover foreign key incorreta se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ticket_history_user_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_history DROP CONSTRAINT ticket_history_user_id_fkey;
  END IF;
END $$;

-- Verificar se o trigger está criado corretamente
SELECT tgname FROM pg_trigger WHERE tgrelid = 'tickets'::regclass;

-- Testar inserção manual sem foreign key problemática
INSERT INTO ticket_history (
  ticket_id, 
  user_id, 
  action, 
  description
) 
SELECT 
  id, 
  '773dc17f-1ac2-4f13-88e1-c422d0de84ab'::uuid, 
  'test_creation', 
  'Teste de criação de histórico'
FROM tickets 
LIMIT 1;