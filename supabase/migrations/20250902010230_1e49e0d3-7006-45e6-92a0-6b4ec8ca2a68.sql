-- Limpar todos os dados de teste, mantendo apenas a conta admin
-- Primeiro, identificar o usuário admin (system_owner)
DO $$
DECLARE
    admin_user_id uuid;
    admin_company_id uuid;
BEGIN
    -- Buscar o usuário admin
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'system_owner' 
    LIMIT 1;
    
    -- Buscar a empresa admin
    SELECT company_id INTO admin_company_id 
    FROM public.profiles 
    WHERE user_id = admin_user_id;
    
    -- Limpar dados em ordem devido às foreign keys
    
    -- 1. Limpar histórico de tickets
    DELETE FROM public.ticket_history 
    WHERE ticket_id IN (
        SELECT id FROM public.tickets 
        WHERE company_id != admin_company_id OR company_id IS NULL
    );
    
    -- 2. Limpar comentários de tickets
    DELETE FROM public.ticket_comments 
    WHERE ticket_id IN (
        SELECT id FROM public.tickets 
        WHERE company_id != admin_company_id OR company_id IS NULL
    );
    
    -- 3. Limpar valores de campos customizados
    DELETE FROM public.custom_field_values 
    WHERE ticket_id IN (
        SELECT id FROM public.tickets 
        WHERE company_id != admin_company_id OR company_id IS NULL
    );
    
    -- 4. Limpar compartilhamentos de tickets
    DELETE FROM public.ticket_shares 
    WHERE ticket_id IN (
        SELECT id FROM public.tickets 
        WHERE company_id != admin_company_id OR company_id IS NULL
    );
    
    -- 5. Limpar tickets (exceto da empresa admin)
    DELETE FROM public.tickets 
    WHERE company_id != admin_company_id OR company_id IS NULL;
    
    -- 6. Limpar notas técnicas
    DELETE FROM public.technical_notes 
    WHERE company_id != admin_company_id OR company_id IS NULL;
    
    -- 7. Limpar clientes
    DELETE FROM public.clients 
    WHERE company_id != admin_company_id OR company_id IS NULL;
    
    -- 8. Limpar campos customizados
    DELETE FROM public.custom_fields 
    WHERE company_id != admin_company_id OR company_id IS NULL;
    
    -- 9. Limpar categorias
    DELETE FROM public.categories 
    WHERE company_id != admin_company_id OR company_id IS NULL;
    
    -- 10. Limpar configurações de notificação de usuários não admin
    DELETE FROM public.user_notification_settings 
    WHERE user_id != admin_user_id;
    
    -- 11. Limpar histórico de chat
    DELETE FROM public.n8n_chat_histories 
    WHERE user_id != admin_user_id;
    
    -- 12. Limpar perfis (exceto admin)
    DELETE FROM public.profiles 
    WHERE user_id != admin_user_id;
    
    -- 13. Limpar empresas (exceto empresa admin)
    DELETE FROM public.companies 
    WHERE id != admin_company_id;
    
    -- Log do resultado
    RAISE NOTICE 'Dados de teste limpos com sucesso. Mantido usuário admin: %', admin_user_id;
END $$;