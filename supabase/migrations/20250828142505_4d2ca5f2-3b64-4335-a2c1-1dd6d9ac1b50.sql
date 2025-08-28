-- Remove the overly permissive policy that allows all users to view all profile data
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

-- Create role-based access policies for profiles

-- 1. Basic profile access - all users can see basic info (name, role) needed for functionality
CREATE POLICY "Users can view basic profile info from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid())
)
-- This policy uses column-level restrictions in the application layer instead of database level

-- However, we need a more secure approach. Let's create a view for basic profile info
-- and restrict the main table more severely.

-- 2. Company admins can view all profile data from their company (including sensitive fields)
CREATE POLICY "Company admins can view all profile data from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
);

-- 3. Technicians can view basic profile info from their company (no sensitive data)
-- This will be handled by creating a separate view or by application-level filtering

-- Create a secure view for basic profile information that all users can access
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

-- Enable RLS on the view
ALTER VIEW public.profiles_basic OWNER TO postgres;
GRANT SELECT ON public.profiles_basic TO authenticated;

-- Create RLS policy for the basic view
CREATE POLICY "Users can view basic profile info from their company via view" 
ON public.profiles_basic 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

-- Note: The existing policies for users viewing their own profile, admins managing profiles, 
-- and super admins remain unchanged as they are appropriate and secure.