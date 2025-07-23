-- Criar empresa para o super admin primeiro
INSERT INTO companies (name, plan_id, active) 
SELECT 'TicketFlow Admin', id, true 
FROM plans 
WHERE type = 'enterprise' 
LIMIT 1
ON CONFLICT DO NOTHING;