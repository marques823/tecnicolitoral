-- Limpar sistema super admin antigo e criar um novo integrado

-- 1. Remover função antiga que estava causando problemas
DROP FUNCTION IF EXISTS public.get_super_admin();

-- 2. Limpar perfis super admin antigos com IDs inválidos
DELETE FROM public.profiles WHERE role = 'super_admin' AND user_id::text LIKE '%admin-temp%';

-- 3. Criar um super admin real no sistema de auth e perfil
-- Primeiro, garantir que temos um plano para a empresa admin
DO $$
DECLARE
    admin_company_id uuid;
    admin_plan_id uuid;
BEGIN
    -- Buscar ou criar plano enterprise
    SELECT id INTO admin_plan_id 
    FROM plans 
    WHERE type = 'enterprise'
    LIMIT 1;
    
    IF admin_plan_id IS NULL THEN
        INSERT INTO plans (name, type, max_users, monthly_price, has_custom_fields)
        VALUES ('Enterprise Plan', 'enterprise', 1000, 0, true)
        RETURNING id INTO admin_plan_id;
    END IF;
    
    -- Buscar ou criar empresa admin
    SELECT id INTO admin_company_id 
    FROM companies 
    WHERE name = 'System Admin'
    LIMIT 1;
    
    IF admin_company_id IS NULL THEN
        INSERT INTO companies (name, plan_id, active, primary_color, secondary_color)
        VALUES ('System Admin', admin_plan_id, true, '#dc2626', '#991b1b')
        RETURNING id INTO admin_company_id;
    END IF;
    
    -- Verificar se já existe um super admin válido
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE role = 'super_admin' 
        AND active = true 
        AND user_id IN (SELECT id FROM auth.users)
    ) THEN
        -- Criar perfil super admin fictício que será substituído quando o usuário fizer login
        INSERT INTO profiles (
            user_id,
            company_id, 
            name,
            role,
            active
        ) VALUES (
            gen_random_uuid(),  -- ID temporário que será atualizado no primeiro login
            admin_company_id,
            'Sistema Super Admin',
            'super_admin',
            true
        );
    END IF;
    
    RAISE NOTICE 'Sistema super admin criado com sucesso';
END $$;

-- 4. Função para promover usuário a super admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    target_user_id uuid;
    admin_company_id uuid;
BEGIN
    -- Buscar usuário pelo email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
    END IF;
    
    -- Buscar empresa admin
    SELECT id INTO admin_company_id 
    FROM companies 
    WHERE name = 'System Admin'
    LIMIT 1;
    
    -- Atualizar ou criar perfil como super admin
    INSERT INTO profiles (user_id, company_id, name, role, active)
    VALUES (target_user_id, admin_company_id, 'Super Administrador', 'super_admin', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'super_admin',
        company_id = admin_company_id,
        active = true;
    
    RETURN true;
END;
$$;