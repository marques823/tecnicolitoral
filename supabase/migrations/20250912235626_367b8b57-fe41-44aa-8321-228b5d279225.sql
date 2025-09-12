-- Fix security vulnerability in clients table RLS policies
-- The current "Technicians can view client data for their assigned tickets" policy
-- is too broad and allows technicians to see ALL clients in their company

-- Drop the overly permissive technician policy
DROP POLICY IF EXISTS "Technicians can view client data for their assigned tickets" ON public.clients;

-- Create a more restrictive policy that only allows technicians to view
-- clients that are specifically assigned to tickets they are working on
CREATE POLICY "Technicians can view clients for their assigned tickets only" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN tickets t ON (t.assigned_to = p.user_id AND t.client_id = clients.id)
    WHERE p.user_id = auth.uid() 
    AND p.role = 'technician'::user_role 
    AND p.company_id = clients.company_id
  )
);

-- Also restrict the general user creation policy to only allow company admins
-- to create client records for better data governance
DROP POLICY IF EXISTS "Users can create client records for their company" ON public.clients;

CREATE POLICY "Only company admins can create client records" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
);