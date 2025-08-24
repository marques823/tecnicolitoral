-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company_name TEXT,
  document TEXT, -- CPF/CNPJ
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies para clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Masters podem gerenciar clientes da sua empresa
CREATE POLICY "Masters can manage clients for their company"
  ON public.clients
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND user_has_master_role(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND user_has_master_role(auth.uid()));

-- Usuários podem ver clientes da sua empresa
CREATE POLICY "Users can view clients from their company"
  ON public.clients
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- Super admins podem ver todos os clientes
CREATE POLICY "Super admins can view all clients"
  ON public.clients
  FOR SELECT
  USING (user_is_super_admin(auth.uid()));

-- Modificar tabela de tickets para referenciar clientes
ALTER TABLE public.tickets 
ADD COLUMN client_id UUID,
DROP COLUMN client_name,
DROP COLUMN client_email,
DROP COLUMN client_phone,
DROP COLUMN client_address,
DROP COLUMN client_company,
DROP COLUMN client_document;

-- Adicionar foreign key para clientes
ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id);