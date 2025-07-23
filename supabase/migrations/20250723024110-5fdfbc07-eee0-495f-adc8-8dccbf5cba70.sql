-- Inserir categorias padrão para as empresas existentes
INSERT INTO public.categories (name, description, company_id) 
SELECT 'Suporte Técnico', 'Problemas com hardware e software', id FROM public.companies WHERE active = true;

INSERT INTO public.categories (name, description, company_id) 
SELECT 'Rede e Internet', 'Problemas de conectividade e rede', id FROM public.companies WHERE active = true;

INSERT INTO public.categories (name, description, company_id) 
SELECT 'Impressoras', 'Problemas com impressoras e equipamentos', id FROM public.companies WHERE active = true;

INSERT INTO public.categories (name, description, company_id) 
SELECT 'Sistema', 'Problemas com sistemas internos', id FROM public.companies WHERE active = true;