-- Create RPC to atomically create a company and its master profile
CREATE OR REPLACE FUNCTION public.create_company_and_profile(
  company_name text,
  plan_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Create company
  INSERT INTO public.companies (name, plan_id, active)
  VALUES (company_name, plan_id, true)
  RETURNING id INTO v_company_id;

  -- Create caller's profile as master in that company
  INSERT INTO public.profiles (user_id, company_id, name, role, active)
  VALUES (auth.uid(), v_company_id, company_name, 'master', true);

  RETURN v_company_id;
END;
$$;

-- Lock down and grant execute to authenticated users
REVOKE ALL ON FUNCTION public.create_company_and_profile(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_company_and_profile(text, uuid) TO authenticated;