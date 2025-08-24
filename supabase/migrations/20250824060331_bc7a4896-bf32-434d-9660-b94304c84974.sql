-- Renomear roles para ter hierarquia clara
-- Atualizar enum de roles
ALTER TYPE user_role RENAME TO user_role_old;

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

-- Remover enum antigo
DROP TYPE user_role_old;

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

-- Criar função para verificar se é system_owner
CREATE OR REPLACE FUNCTION public.user_is_system_owner(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'system_owner'
  );
$function$;

-- Atualizar função de super_admin para system_owner
DROP FUNCTION IF EXISTS public.user_is_super_admin(uuid);

CREATE OR REPLACE FUNCTION public.user_is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'system_owner'
  );
$function$;

-- Atualizar políticas RLS que referenciam roles antigos
-- Categorias
DROP POLICY IF EXISTS "Masters can manage categories for their company" ON categories;
CREATE POLICY "Company admins can manage categories for their company" 
ON categories 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all categories" ON categories;
CREATE POLICY "System owners can view all categories" 
ON categories 
FOR SELECT
USING (user_is_super_admin(auth.uid()));

-- Custom Fields
DROP POLICY IF EXISTS "Masters can manage custom fields for their company" ON custom_fields;
CREATE POLICY "Company admins can manage custom fields for their company" 
ON custom_fields 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

-- Clients
DROP POLICY IF EXISTS "Masters can manage clients for their company" ON clients;
CREATE POLICY "Company admins can manage clients for their company" 
ON clients 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all clients" ON clients;
CREATE POLICY "System owners can view all clients" 
ON clients 
FOR SELECT
USING (user_is_super_admin(auth.uid()));

-- Companies
DROP POLICY IF EXISTS "Masters can update their own company" ON companies;
CREATE POLICY "Company admins can update their own company" 
ON companies 
FOR UPDATE
USING ((id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update all companies" ON companies;
CREATE POLICY "System owners can update all companies" 
ON companies 
FOR UPDATE
USING (user_is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
CREATE POLICY "System owners can view all companies" 
ON companies 
FOR SELECT
USING (user_is_super_admin(auth.uid()));

-- Profiles
DROP POLICY IF EXISTS "Masters can insert profiles for their company" ON profiles;
CREATE POLICY "Company admins can insert profiles for their company" 
ON profiles 
FOR INSERT
WITH CHECK (user_has_master_role(auth.uid()) AND (company_id = get_user_company_id(auth.uid())));

DROP POLICY IF EXISTS "Masters can update profiles from their company" ON profiles;
CREATE POLICY "Company admins can update profiles from their company" 
ON profiles 
FOR UPDATE
USING (user_has_master_role(auth.uid()) AND (company_id = get_user_company_id(auth.uid())));

DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
CREATE POLICY "System owners can update all profiles" 
ON profiles 
FOR UPDATE
USING (user_is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
CREATE POLICY "System owners can view all profiles" 
ON profiles 
FOR SELECT
USING (user_is_super_admin(auth.uid()));

-- Technical Notes
DROP POLICY IF EXISTS "Masters can manage all technical notes from their company" ON technical_notes;
CREATE POLICY "Company admins can manage all technical notes from their company" 
ON technical_notes 
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND user_has_master_role(auth.uid()));

-- Tickets - atualizar para incluir client_users
DROP POLICY IF EXISTS "Masters and technicians can update tickets" ON tickets;
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

DROP POLICY IF EXISTS "Super admins can view all tickets" ON tickets;
CREATE POLICY "System owners can view all tickets" 
ON tickets 
FOR SELECT
USING (user_is_super_admin(auth.uid()));

-- User notification settings
DROP POLICY IF EXISTS "Super admins can view all notification settings" ON user_notification_settings;
CREATE POLICY "System owners can view all notification settings" 
ON user_notification_settings 
FOR SELECT
USING (user_is_super_admin(auth.uid()));

-- Chat histories
DROP POLICY IF EXISTS "Masters can access company chat histories" ON n8n_chat_histories;
CREATE POLICY "Company admins can access company chat histories" 
ON n8n_chat_histories 
FOR SELECT
USING (user_has_master_role(auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = n8n_chat_histories.user_id) AND (profiles.company_id = get_user_company_id(auth.uid()))))));

DROP POLICY IF EXISTS "Super admins can access all chat histories" ON n8n_chat_histories;
CREATE POLICY "System owners can access all chat histories" 
ON n8n_chat_histories 
FOR ALL
USING (user_is_super_admin(auth.uid()))
WITH CHECK (user_is_super_admin(auth.uid()));