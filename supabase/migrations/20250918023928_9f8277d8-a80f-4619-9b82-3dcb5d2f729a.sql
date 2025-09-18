-- Limpar tickets de teste (soft delete para manter histórico)
UPDATE public.tickets 
SET deleted_at = now(), updated_at = now()
WHERE title LIKE '%Teste%' OR title LIKE '%Test%' OR title = 'Teste';