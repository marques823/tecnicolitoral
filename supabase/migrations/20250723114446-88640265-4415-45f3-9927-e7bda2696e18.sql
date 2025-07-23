-- Criar usuário super admin e perfil
DO $$
DECLARE
    admin_user_id uuid;
    admin_company_id uuid;
BEGIN
    -- Buscar empresa existente
    SELECT id INTO admin_company_id FROM companies LIMIT 1;
    
    -- Inserir usuário diretamente na tabela auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        role,
        aud
    ) VALUES (
        gen_random_uuid(),
        'admin@ticketflow.com',
        crypt('T84dy866n@', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"name": "Super Administrador"}'::jsonb,
        'authenticated',
        'authenticated'
    ) 
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('T84dy866n@', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO admin_user_id;
    
    -- Se não conseguiu inserir, buscar usuário existente
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@ticketflow.com';
    END IF;
    
    -- Criar perfil super admin
    INSERT INTO profiles (user_id, company_id, name, role, active)
    VALUES (admin_user_id, admin_company_id, 'Super Administrador', 'super_admin', true)
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        name = 'Super Administrador',
        active = true;
        
END $$;