-- Função para buscar super admin que contorna RLS
CREATE OR REPLACE FUNCTION public.get_super_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  company_id uuid,
  name text,
  role user_role,
  active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    id, user_id, company_id, name, role, active, created_at, updated_at
  FROM public.profiles 
  WHERE role = 'super_admin' AND active = true
  LIMIT 1;
$$;