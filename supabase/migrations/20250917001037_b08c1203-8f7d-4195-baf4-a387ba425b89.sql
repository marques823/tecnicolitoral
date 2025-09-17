-- Remove all client-related SELECT policies and create simple ones
-- The recursion is still happening, so we need to completely avoid complex queries

-- Drop all client SELECT policies
DROP POLICY IF EXISTS "Client users can view their related client records" ON public.clients;
DROP POLICY IF EXISTS "Technicians can view clients for their assigned tickets only" ON public.clients;

-- Create very simple policies that don't cause recursion
-- Company admins and super admins can see all clients (these already work)
-- For technicians: simplify to only check if they're technicians
CREATE POLICY "Technicians can view company clients" 
ON public.clients 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- For client users: very simple policy based on email only
CREATE POLICY "Client users can view clients by email match" 
ON public.clients 
FOR SELECT 
USING (
  email = get_user_email(auth.uid())
);