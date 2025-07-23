-- Testar se o trigger funciona com UPDATE
UPDATE tickets 
SET status = 'in_progress' 
WHERE id = '45fa9822-8f82-4f4a-8519-8fdbd1300f98';

-- Verificar se o histórico foi criado
SELECT * FROM ticket_history 
WHERE ticket_id = '45fa9822-8f82-4f4a-8519-8fdbd1300f98' 
ORDER BY created_at DESC;