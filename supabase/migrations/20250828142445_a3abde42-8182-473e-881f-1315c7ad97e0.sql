-- Remove the overly permissive policy that allows all users to view all profile data
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

-- Create role-based access policies for profiles

-- 1. Company admins can view all profile data from their company (including sensitive fields)
CREATE POLICY "Company admins can view all profile data from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
);

-- 2. Create a secure view for basic profile information that non-admin users can access
CREATE OR REPLACE VIEW public.profiles_basic AS
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

-- Grant access to the view
GRANT SELECT ON public.profiles_basic TO authenticated;

-- Note: We'll handle application-level filtering for technicians to use the basic view
-- The existing policies for users viewing their own profile, admins managing profiles, 
-- and super admins remain unchanged as they are appropriate and secure.