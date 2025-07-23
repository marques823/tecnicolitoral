-- Fix function security issues by setting search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Users will need to be assigned to a company manually by a master user
  -- This is just a placeholder for the auth user
  RETURN NEW;
END;
$$;

-- Enable RLS on plans table
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policy for plans table (can be viewed by all authenticated users)
CREATE POLICY "Authenticated users can view plans" ON public.plans
  FOR SELECT TO authenticated
  USING (true);