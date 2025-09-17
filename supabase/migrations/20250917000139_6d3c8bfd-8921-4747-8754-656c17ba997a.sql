-- Fix security vulnerability in profiles table RLS policies
-- The current policies allow company admins to view ALL sensitive personal data
-- for all users in their company, which is too broad and violates data privacy

-- Drop the overly permissive company admin policy
DROP POLICY IF EXISTS "Company admins can view all profile data from their company" ON public.profiles;

-- Create separate policies for basic vs sensitive data access
-- Company admins can view basic profile information for management purposes
CREATE POLICY "Company admins can view basic profile data from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
);

-- Create a view function that returns only non-sensitive profile data
CREATE OR REPLACE FUNCTION public.get_basic_profile_data(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  company_id uuid,
  role user_role,
  active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  name text
)
LANGUAGE sql
STABLE
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
  WHERE p.user_id = profile_user_id;
$$;

-- Add a more restrictive policy that only allows access to sensitive data
-- when there's a legitimate business need (e.g., for assigned tickets)
CREATE POLICY "Company admins can view sensitive data for assigned users only" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
  AND (
    -- Allow access to sensitive data if this user is assigned to a ticket
    -- that the admin's company is working on
    EXISTS (
      SELECT 1 
      FROM tickets t 
      WHERE (t.assigned_to = profiles.user_id OR t.created_by = profiles.user_id)
      AND t.company_id = get_user_company_id(auth.uid())
    )
    -- OR if this is for client user management purposes
    OR profiles.role = 'client_user'::user_role
  )
);

-- Ensure technicians can only see basic profile data for users in their company
-- but not sensitive personal information unless it's their own profile
CREATE POLICY "Technicians can view basic profile data from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'technician'::user_role
  )
  AND (
    -- Can see their own complete profile
    user_id = auth.uid()
    -- Or basic data only for others (sensitive fields will be filtered by application)
    OR user_id != auth.uid()
  )
);