-- Remove the incorrect policy for public role
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Create the correct policy for authenticated users
CREATE POLICY "Authenticated users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);