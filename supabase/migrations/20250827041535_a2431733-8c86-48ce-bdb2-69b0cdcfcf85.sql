-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Não criar perfil automaticamente se não tem metadata
  -- O perfil será criado manualmente durante o processo de seleção de plano
  -- ou durante o processo de criação da empresa
  RETURN NEW;
END;
$$;

-- Trigger para executar a função quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar política de INSERT de perfis para permitir criação inicial
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Adicionar política para permitir inserção sem company_id inicialmente
CREATE POLICY "Users can insert profile without company during signup" ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id IS NULL);