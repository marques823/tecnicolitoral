-- Fix infinite recursion in clients table RLS policies
-- The "Client users can view their own client record" policy is causing recursion
-- because it queries the profiles table which can cause circular dependencies

-- Drop the problematic client user policy
DROP POLICY IF EXISTS "Client users can view their own client record" ON public.clients;

-- Create a simpler, non-recursive policy for client users
-- This policy will allow client users to view clients based on their email directly
CREATE POLICY "Client users can view their related client records" 
ON public.clients 
FOR SELECT 
USING (
  -- Allow client users to see their client record by matching email
  email = get_user_email(auth.uid())
  AND EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_user'::user_role
    AND p.company_id = clients.company_id
  )
);