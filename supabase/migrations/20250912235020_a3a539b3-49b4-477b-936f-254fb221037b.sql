-- Verificar se a tabela tickets está na publicação de realtime
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Se não estiver, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
    END IF;
END $$;

-- Configurar REPLICA IDENTITY para capturar todas as mudanças
ALTER TABLE public.tickets REPLICA IDENTITY FULL;