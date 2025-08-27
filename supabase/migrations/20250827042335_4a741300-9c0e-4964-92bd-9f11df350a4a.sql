-- Criar função para criar empresa e perfil automaticamente
CREATE OR REPLACE FUNCTION public.create_company_and_profile(company_name text, plan_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_user_id uuid;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se o plano existe
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id) THEN
    RAISE EXCEPTION 'Plano não encontrado';
  END IF;

  -- Verificar se o usuário já possui empresa
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id AND company_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Usuário já possui empresa';
  END IF;

  -- Criar empresa
  INSERT INTO public.companies (name, plan_id, active)
  VALUES (company_name, plan_id, true)
  RETURNING id INTO v_company_id;

  -- Criar ou atualizar perfil do usuário como admin da empresa
  INSERT INTO public.profiles (user_id, company_id, name, role, active)
  VALUES (v_user_id, v_company_id, split_part(company_name, ' de ', 2), 'company_admin', true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    company_id = v_company_id,
    role = 'company_admin',
    active = true,
    updated_at = now();

  RETURN v_company_id;
END;
$$;