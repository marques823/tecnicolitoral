-- Limpar completamente todos os dados, incluindo a conta admin
DO $$
BEGIN
    -- Limpar dados em ordem devido às foreign keys
    
    -- 1. Limpar histórico de tickets
    DELETE FROM public.ticket_history;
    
    -- 2. Limpar comentários de tickets
    DELETE FROM public.ticket_comments;
    
    -- 3. Limpar valores de campos customizados
    DELETE FROM public.custom_field_values;
    
    -- 4. Limpar compartilhamentos de tickets
    DELETE FROM public.ticket_shares;
    
    -- 5. Limpar tickets
    DELETE FROM public.tickets;
    
    -- 6. Limpar notas técnicas
    DELETE FROM public.technical_notes;
    
    -- 7. Limpar clientes
    DELETE FROM public.clients;
    
    -- 8. Limpar campos customizados
    DELETE FROM public.custom_fields;
    
    -- 9. Limpar categorias
    DELETE FROM public.categories;
    
    -- 10. Limpar configurações de notificação
    DELETE FROM public.user_notification_settings;
    
    -- 11. Limpar histórico de chat
    DELETE FROM public.n8n_chat_histories;
    
    -- 12. Limpar perfis
    DELETE FROM public.profiles;
    
    -- 13. Limpar empresas
    DELETE FROM public.companies;
    
    -- 14. Limpar usuários do auth
    DELETE FROM auth.users;
    
    -- Log do resultado
    RAISE NOTICE 'Todos os dados foram limpos. Banco zerado completamente.';
END $$;