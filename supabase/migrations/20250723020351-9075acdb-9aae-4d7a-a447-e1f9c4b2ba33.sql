-- Create security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create function to check if user has master role
CREATE OR REPLACE FUNCTION public.user_has_master_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'master'
  );
$$;

-- Drop and recreate all problematic policies

-- Fix profiles policies
DROP POLICY IF EXISTS "Masters can insert profiles for their company" ON public.profiles;
DROP POLICY IF EXISTS "Masters can update profiles from their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

CREATE POLICY "Masters can insert profiles for their company" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.user_has_master_role(auth.uid()) AND 
  company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Masters can update profiles from their company" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  public.user_has_master_role(auth.uid()) AND 
  company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Users can view profiles from their company" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Fix companies policy
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (id = public.get_user_company_id(auth.uid()));

-- Fix tickets policies
DROP POLICY IF EXISTS "Masters and technicians can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets for their company" ON public.tickets;
DROP POLICY IF EXISTS "Users can view tickets from their company" ON public.tickets;

CREATE POLICY "Masters and technicians can update tickets" 
ON public.tickets 
FOR UPDATE 
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'technician')
  )
);

CREATE POLICY "Users can create tickets for their company" 
ON public.tickets 
FOR INSERT 
TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can view tickets from their company" 
ON public.tickets 
FOR SELECT 
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Fix categories policies
DROP POLICY IF EXISTS "Masters can manage categories for their company" ON public.categories;
DROP POLICY IF EXISTS "Users can view categories from their company" ON public.categories;

CREATE POLICY "Masters can manage categories for their company" 
ON public.categories 
FOR ALL 
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid()) AND
  public.user_has_master_role(auth.uid())
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid()) AND
  public.user_has_master_role(auth.uid())
);

CREATE POLICY "Users can view categories from their company" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Fix ticket_history policies
DROP POLICY IF EXISTS "Users can insert ticket history" ON public.ticket_history;
DROP POLICY IF EXISTS "Users can view ticket history from their company" ON public.ticket_history;

CREATE POLICY "Users can insert ticket history" 
ON public.ticket_history 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_id 
    AND t.company_id = public.get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can view ticket history from their company" 
ON public.ticket_history 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = ticket_id 
    AND t.company_id = public.get_user_company_id(auth.uid())
  )
);