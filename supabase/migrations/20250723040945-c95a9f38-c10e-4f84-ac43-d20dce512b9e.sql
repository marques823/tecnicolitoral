-- Popular histórico dos tickets existentes que não têm histórico
INSERT INTO public.ticket_history (ticket_id, user_id, action, description, created_at)
SELECT 
  t.id,
  t.created_by,
  'created',
  'Ticket criado (migração)',
  t.created_at
FROM tickets t
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_history th 
  WHERE th.ticket_id = t.id AND th.action = 'created'
);