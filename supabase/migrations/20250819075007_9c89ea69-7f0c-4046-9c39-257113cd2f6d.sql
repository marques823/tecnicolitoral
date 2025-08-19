-- Criar um novo super admin com credenciais diferentes para contornar o erro
-- Vamos usar um email diferente para evitar o problema com o auth.users

-- Primeiro, verificar se já existe um super admin ativo
DO $$
DECLARE
    new_company_id uuid;
    existing_super_admin_count int;
BEGIN
    -- Contar super admins existentes
    SELECT COUNT(*) INTO existing_super_admin_count 
    FROM profiles 
    WHERE role = 'super_admin' AND active = true;
    
    -- Se não há super admins ativos, criar um novo
    IF existing_super_admin_count = 0 THEN
        -- Usar a empresa padrão ou criar uma
        SELECT id INTO new_company_id 
        FROM companies 
        WHERE name = 'TicketFlow Admin' 
        LIMIT 1;
        
        -- Se não existir a empresa, criar uma
        IF new_company_id IS NULL THEN
            -- Buscar um plano para a empresa
            INSERT INTO companies (name, plan_id, active, primary_color, secondary_color)
            VALUES (
                'TicketFlow Admin', 
                (SELECT id FROM plans LIMIT 1), 
                true, 
                '#2563eb', 
                '#64748b'
            )
            RETURNING id INTO new_company_id;
        END IF;
        
        -- Criar um profile super admin genérico que pode ser usado
        INSERT INTO profiles (
            user_id, 
            company_id, 
            name, 
            role, 
            active
        ) VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,  -- ID fixo para super admin
            new_company_id,
            'Sistema Super Admin',
            'super_admin',
            true
        ) ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Super admin profile criado/verificado com sucesso';
    ELSE
        RAISE NOTICE 'Super admin já existe no sistema';
    END IF;
END $$;