-- Segunda parte: Criar função e políticas para super admin
CREATE OR REPLACE FUNCTION public.user_is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
$$;

-- Criar políticas RLS para super admin ver todas as empresas
CREATE POLICY "Super admins can view all companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (user_is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all companies" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (user_is_super_admin(auth.uid()));

-- Criar políticas RLS para super admin ver todos os perfis
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_is_super_admin(auth.uid()));

-- Criar políticas RLS para super admin ver todos os tickets
CREATE POLICY "Super admins can view all tickets" 
ON public.tickets 
FOR SELECT 
TO authenticated
USING (user_is_super_admin(auth.uid()));

-- Criar políticas RLS para super admin ver todas as categorias
CREATE POLICY "Super admins can view all categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (user_is_super_admin(auth.uid()));

-- Criar políticas RLS para super admin ver todo o histórico de tickets
CREATE POLICY "Super admins can view all ticket history" 
ON public.ticket_history 
FOR SELECT 
TO authenticated
USING (user_is_super_admin(auth.uid()));