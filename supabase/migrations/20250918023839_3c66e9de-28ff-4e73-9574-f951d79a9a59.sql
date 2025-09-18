-- Limpar tickets de teste (soft delete para manter histórico)
UPDATE public.tickets 
SET deleted_at = now(), updated_at = now()
WHERE title LIKE '%Teste%' OR title LIKE '%Test%';

-- Registrar no histórico que foram limpos
INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
SELECT 
    id,
    '2da9247e-472d-4620-bb8f-1f8075f94be9'::uuid, -- ID do usuário admin
    'cleanup',
    'Ticket de teste removido durante limpeza'
FROM public.tickets 
WHERE (title LIKE '%Teste%' OR title LIKE '%Test%') 
AND deleted_at IS NOT NULL;