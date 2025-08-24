-- Adicionar campos de informações do cliente e empresa aos tickets
ALTER TABLE public.tickets 
ADD COLUMN client_name TEXT,
ADD COLUMN client_email TEXT,
ADD COLUMN client_phone TEXT,
ADD COLUMN client_address TEXT,
ADD COLUMN client_company TEXT,
ADD COLUMN client_document TEXT; -- CPF/CNPJ

-- Comentários para documentar os campos
COMMENT ON COLUMN public.tickets.client_name IS 'Nome do cliente';
COMMENT ON COLUMN public.tickets.client_email IS 'Email do cliente';
COMMENT ON COLUMN public.tickets.client_phone IS 'Telefone do cliente';
COMMENT ON COLUMN public.tickets.client_address IS 'Endereço do cliente';
COMMENT ON COLUMN public.tickets.client_company IS 'Empresa do cliente';
COMMENT ON COLUMN public.tickets.client_document IS 'CPF ou CNPJ do cliente';