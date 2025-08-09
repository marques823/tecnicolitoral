-- Allow the function owner (supabase_admin) to insert into companies via RLS
CREATE POLICY IF NOT EXISTS "Admin can insert companies"
ON public.companies
FOR INSERT
TO supabase_admin
WITH CHECK (true);

-- (Keep existing authenticated insert policy intact)
