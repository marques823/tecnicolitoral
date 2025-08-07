-- Drop the current policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Create a new policy that's more specific
CREATE POLICY "Users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);