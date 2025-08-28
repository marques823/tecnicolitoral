-- Fix the security definer view issue by dropping and recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.profiles_basic;

-- Create the view without SECURITY DEFINER (using SECURITY INVOKER by default)
CREATE VIEW public.profiles_basic AS
SELECT 
  id,
  user_id,
  company_id,
  role,
  active,
  created_at,
  updated_at,
  name
FROM public.profiles;

-- Enable RLS on the view (this is safer than SECURITY DEFINER)
ALTER VIEW public.profiles_basic SET ROW SECURITY ENFORCED;

-- Grant access to the view  
GRANT SELECT ON public.profiles_basic TO authenticated;

-- Create RLS policy for the basic view to allow company users to see basic info
CREATE POLICY "Users can view basic profile info from their company" 
ON public.profiles_basic 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));