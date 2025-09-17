-- Corrigir contagem de usuários excluindo admin do limite
-- Atualizar função get_basic_profiles para incluir dados de contato quando necessário
CREATE OR REPLACE FUNCTION public.get_user_count_excluding_admin(target_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.profiles 
  WHERE company_id = target_company_id 
    AND active = true 
    AND role != 'company_admin';
$$;