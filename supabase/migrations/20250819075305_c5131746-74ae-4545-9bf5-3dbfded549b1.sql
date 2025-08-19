-- Criar super admin funcional com UUID válido
DO $$
DECLARE
    admin_company_id uuid;
    default_plan_id uuid;
    admin_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Buscar um plano disponível
    SELECT id INTO default_plan_id 
    FROM plans 
    LIMIT 1;
    
    -- Se não há planos, criar um básico
    IF default_plan_id IS NULL THEN
        INSERT INTO plans (name, type, max_users, monthly_price, has_custom_fields)
        VALUES ('Admin Plan', 'enterprise', 1000, 0, true)
        RETURNING id INTO default_plan_id;
    END IF;
    
    -- Buscar ou criar empresa para super admin
    SELECT id INTO admin_company_id 
    FROM companies 
    WHERE name = 'TicketFlow Admin'
    LIMIT 1;
    
    IF admin_company_id IS NULL THEN
        INSERT INTO companies (name, plan_id, active, primary_color, secondary_color)
        VALUES ('TicketFlow Admin', default_plan_id, true, '#2563eb', '#64748b')
        RETURNING id INTO admin_company_id;
    END IF;
    
    -- Criar perfil super admin com UUID válido
    INSERT INTO profiles (
        user_id,
        company_id, 
        name,
        role,
        active
    ) VALUES (
        admin_user_id,
        admin_company_id,
        'Sistema Super Admin',
        'super_admin',
        true
    ) ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        active = EXCLUDED.active,
        company_id = EXCLUDED.company_id;
        
    RAISE NOTICE 'Super admin criado/atualizado com ID: %', admin_user_id;
END $$;