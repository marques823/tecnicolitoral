-- Adicionar campos de informações adicionais para clientes na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN cpf_cnpj TEXT,
ADD COLUMN razao_social TEXT,
ADD COLUMN endereco TEXT,
ADD COLUMN telefone TEXT,
ADD COLUMN email_contato TEXT;