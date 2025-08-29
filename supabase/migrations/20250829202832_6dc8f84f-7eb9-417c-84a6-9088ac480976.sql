-- Primeiro dropar o trigger se ele já existir
DROP TRIGGER IF EXISTS company_deactivation_trigger ON public.companies;

-- Recriar a função para desativar usuários quando empresa é desativada
CREATE OR REPLACE FUNCTION public.handle_company_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a empresa foi desativada (active passou de true para false)
  IF OLD.active = true AND NEW.active = false THEN
    -- Desativar todos os perfis associados à empresa
    UPDATE public.profiles 
    SET active = false, company_id = null, updated_at = now()
    WHERE company_id = NEW.id;
    
    -- Log da ação
    RAISE NOTICE 'Empresa % desativada. Usuários associados foram desativados.', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando uma empresa for atualizada
CREATE TRIGGER company_deactivation_trigger
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_company_deactivation();