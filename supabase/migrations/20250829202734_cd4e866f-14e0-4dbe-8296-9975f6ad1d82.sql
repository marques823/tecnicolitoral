-- Criar função para desativar usuários quando empresa é desativada
CREATE OR REPLACE FUNCTION public.handle_company_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a empresa foi desativada (active passou de true para false)
  IF OLD.active = true AND NEW.active = false THEN
    -- Desativar todos os perfis associados à empresa
    UPDATE public.profiles 
    SET active = false, company_id = null, updated_at = now()
    WHERE company_id = NEW.id;
    
    -- Opcionalmente, podemos também deletar os usuários do auth.users
    -- Mas isso é mais drástico e pode causar problemas
    -- DELETE FROM auth.users 
    -- WHERE id IN (SELECT user_id FROM public.profiles WHERE company_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando uma empresa for atualizada
CREATE TRIGGER company_deactivation_trigger
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_company_deactivation();