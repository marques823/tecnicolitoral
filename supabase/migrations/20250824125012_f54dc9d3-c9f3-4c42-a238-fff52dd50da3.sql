-- Corrigir a função user_is_super_admin para usar 'system_owner' ao invés de 'super_admin'
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