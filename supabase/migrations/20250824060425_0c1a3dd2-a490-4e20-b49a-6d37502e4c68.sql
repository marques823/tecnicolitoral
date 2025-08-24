-- Remover políticas que dependem do enum user_role
DROP POLICY IF EXISTS "Masters and technicians can update tickets" ON tickets;
DROP POLICY IF EXISTS "Masters can manage categories for their company" ON categories;
DROP POLICY IF EXISTS "Masters can manage custom fields for their company" ON custom_fields;
DROP POLICY IF EXISTS "Masters can manage clients for their company" ON clients;
DROP POLICY IF EXISTS "Masters can update their own company" ON companies;
DROP POLICY IF EXISTS "Masters can insert profiles for their company" ON profiles;
DROP POLICY IF EXISTS "Masters can update profiles from their company" ON profiles;
DROP POLICY IF EXISTS "Masters can manage all technical notes from their company" ON technical_notes;
DROP POLICY IF EXISTS "Masters can access company chat histories" ON n8n_chat_histories;

-- Remover valor padrão da coluna role
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Renomear enum antigo
ALTER TYPE user_role RENAME TO user_role_old;

-- Criar novo enum com roles organizados
CREATE TYPE user_role AS ENUM ('system_owner', 'company_admin', 'technician', 'client_user');

-- Atualizar tabela profiles com novos roles
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING (
  CASE role::text
    WHEN 'super_admin' THEN 'system_owner'::user_role
    WHEN 'master' THEN 'company_admin'::user_role
    WHEN 'client' THEN 'client_user'::user_role
    WHEN 'technician' THEN 'technician'::user_role
    ELSE 'client_user'::user_role
  END
);

-- Definir novo valor padrão
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'client_user'::user_role;

-- Remover enum antigo
DROP TYPE user_role_old;

-- Recriar todas as políticas com os novos roles
CREATE POLICY "Company admins can manage categories for their company" 
ON categories 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

CREATE POLICY "Company admins can manage custom fields for their company" 
ON custom_fields 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

CREATE POLICY "Company admins can manage clients for their company" 
ON clients 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

CREATE POLICY "Company admins can update their own company" 
ON companies 
FOR UPDATE
USING ((id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

CREATE POLICY "Company admins can insert profiles for their company" 
ON profiles 
FOR INSERT
WITH CHECK (user_has_master_role(auth.uid()) AND (company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Company admins can update profiles from their company" 
ON profiles 
FOR UPDATE
USING (user_has_master_role(auth.uid()) AND (company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Company admins can manage all technical notes from their company" 
ON technical_notes 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

CREATE POLICY "Company admins and technicians can update tickets" 
ON tickets 
FOR UPDATE
USING ((company_id = get_user_company_id(auth.uid())) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['company_admin'::user_role, 'technician'::user_role]))))));

-- Permitir que client_users vejam apenas seus próprios tickets
CREATE POLICY "Client users can view their own tickets" 
ON tickets 
FOR SELECT
USING ((company_id = get_user_company_id(auth.uid())) AND 
       (created_by = auth.uid()) AND 
       (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'client_user')));

CREATE POLICY "Company admins can access company chat histories" 
ON n8n_chat_histories 
FOR SELECT
USING (user_has_master_role(auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = n8n_chat_histories.user_id) AND (profiles.company_id = get_user_company_id(auth.uid()))))));

-- Atualizar funções que referenciam roles
CREATE OR REPLACE FUNCTION public.user_has_master_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'company_admin'
  );
$function$;