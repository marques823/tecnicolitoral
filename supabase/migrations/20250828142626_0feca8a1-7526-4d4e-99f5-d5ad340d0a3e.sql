-- Drop the view that's causing issues
DROP VIEW IF EXISTS public.profiles_basic;

-- Create a simple function instead that returns only basic profile info
CREATE OR REPLACE FUNCTION public.get_basic_profiles(target_company_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  company_id uuid,
  role user_role,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.company_id,
    p.role,
    p.active,
    p.created_at,
    p.updated_at,
    p.name
  FROM public.profiles p
  WHERE p.company_id = target_company_id
    AND p.company_id = get_user_company_id(auth.uid());
$$;