-- Fix infinite recursion in profiles table RLS policies
-- The recent security changes caused recursion because policies were
-- querying the profiles table within the profiles table policies

-- Drop all the problematic policies
DROP POLICY IF EXISTS "Company admins can view basic profile data from their company" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view sensitive data for assigned users only" ON public.profiles;
DROP POLICY IF EXISTS "Technicians can view basic profile data from their company" ON public.profiles;

-- Restore the original working policies but with better security
-- Company admins can view profiles from their company (using existing security definer function)
CREATE POLICY "Company admins can view profiles from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
);

-- Regular users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Super admins can view all profiles (unchanged)
-- This policy already exists and works correctly

-- Users can update their own profile (unchanged)
-- This policy already exists and works correctly

-- Company admins can update profiles from their company (unchanged)  
-- This policy already exists and works correctly

-- Users can insert their own profile (unchanged)
-- This policy already exists and works correctly

-- Company admins can insert profiles for their company (unchanged)
-- This policy already exists and works correctly