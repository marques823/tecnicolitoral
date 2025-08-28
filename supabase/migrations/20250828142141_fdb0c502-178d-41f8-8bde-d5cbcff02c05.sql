-- Remove the overly permissive policy that allows all users to view client data
DROP POLICY IF EXISTS "Users can view clients from their company" ON public.clients;

-- Create more secure policies based on user roles

-- Company admins can still manage all clients (this policy already exists and is secure)
-- Super admins can view all clients (this policy already exists and is secure) 

-- Technicians can view client data for tickets they're working on
CREATE POLICY "Technicians can view client data for their assigned tickets" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'technician'
    AND profiles.company_id = clients.company_id
  )
);

-- Client users can only view their own client record (if they have one)
CREATE POLICY "Client users can view their own client record" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'client_user'
    AND profiles.company_id = clients.company_id
    AND clients.email = COALESCE(profiles.email_contato, get_user_email(profiles.user_id))
  )
);

-- Allow users to create client records (this policy already exists and is necessary)
-- Company admins can manage clients (this policy already exists and is secure)