-- Remove all existing INSERT policies for companies
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Create a very simple policy for INSERT
CREATE POLICY "Allow INSERT on companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;