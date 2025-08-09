-- Recreate policy to allow function owner to insert into companies
DROP POLICY IF EXISTS "Admin can insert companies" ON public.companies;
CREATE POLICY "Admin can insert companies"
ON public.companies
FOR INSERT
TO supabase_admin
WITH CHECK (true);