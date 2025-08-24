-- Corrigir a função promote_to_super_admin para usar 'system_owner' ao invés de 'super_admin'
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Atualizar ou criar perfil como system_owner (não super_admin)
    INSERT INTO public.profiles (user_id, company_id, name, role, active)
    VALUES (target_user_id, admin_company_id, 'Super Administrador', 'system_owner', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'system_owner',
        company_id = admin_company_id,
        active = true;
    
    RETURN true;
END;
$function$