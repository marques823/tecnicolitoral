-- Fix infinite recursion in profiles table RLS policies
-- First check existing policies and drop duplicates

-- Drop all problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Company admins can view basic profile data from their company" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view sensitive data for assigned users only" ON public.profiles;
DROP POLICY IF EXISTS "Technicians can view basic profile data from their company" ON public.profiles;

-- Drop the function that was causing issues
DROP FUNCTION IF EXISTS public.get_basic_profile_data(uuid);

-- Ensure we have clean, working policies
-- The existing "Users can view their own profile" policy should remain
-- The existing "Company admins can view all profile data from their company" should be restored

-- Create a simplified company admin policy that doesn't cause recursion
CREATE POLICY "Company admins can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
);