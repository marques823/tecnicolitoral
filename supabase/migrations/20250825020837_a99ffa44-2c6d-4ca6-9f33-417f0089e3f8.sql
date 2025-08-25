-- Verificar se a função user_has_master_role está correta
-- A política está procurando por 'company_admin' mas a função pode estar procurando 'master'

-- Atualizar a função para ser consistente
CREATE OR REPLACE FUNCTION public.user_has_master_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role IN ('company_admin', 'master')
  );
$$;