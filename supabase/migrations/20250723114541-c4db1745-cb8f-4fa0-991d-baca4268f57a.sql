-- Criar usuário super admin com nova senha
DO $$
DECLARE
    admin_user_id uuid := gen_random_uuid();
    admin_company_id uuid;
BEGIN
    -- Buscar empresa existente
    SELECT id INTO admin_company_id FROM companies LIMIT 1;
    
    -- Deletar usuário existente se houver
    DELETE FROM auth.users WHERE email = 'admin@ticketflow.com';
    
    -- Inserir usuário com ID específico
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        role,
        aud,
        confirmation_token
    ) VALUES (
        admin_user_id,
        'admin@ticketflow.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"name": "Super Administrador"}'::jsonb,
        'authenticated',
        'authenticated',
        ''
    );
    
    -- Criar perfil super admin
    INSERT INTO profiles (user_id, company_id, name, role, active)
    VALUES (admin_user_id, admin_company_id, 'Super Administrador', 'super_admin', true)
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        name = 'Super Administrador',
        active = true;
        
END $$;