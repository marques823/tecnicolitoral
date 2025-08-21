-- Drop da função existente e recriação correta
DROP FUNCTION IF EXISTS public.promote_to_super_admin(text);

-- Recriar a função com search_path correto
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    FROM public.companies 
    WHERE name = 'System Admin'
    LIMIT 1;
    
    -- Atualizar ou criar perfil como super admin
    INSERT INTO public.profiles (user_id, company_id, name, role, active)
    VALUES (target_user_id, admin_company_id, 'Super Administrador', 'super_admin', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'super_admin',
        company_id = admin_company_id,
        active = true;
    
    RETURN true;
END;
$$;