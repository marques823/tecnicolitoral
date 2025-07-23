-- Fix security warnings by setting search_path for the new functions
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_master_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'master'
  );
$$;