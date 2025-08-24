-- Verificar valores válidos do enum user_role
SELECT unnest(enum_range(NULL::user_role)) as valid_roles;

-- Corrigir as funções que usam 'super_admin' incorretamente
-- A função user_is_super_admin está procurando por 'super_admin' mas deveria ser 'system_owner'
CREATE OR REPLACE FUNCTION public.user_is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'system_owner'
  );
$function$

-- Corrigir também a função promote_to_super_admin
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