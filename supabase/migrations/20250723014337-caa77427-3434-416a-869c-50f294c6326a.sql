-- Insert sample companies
INSERT INTO public.companies (id, name, plan_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', (SELECT id FROM public.plans WHERE type = 'premium' LIMIT 1)),
('550e8400-e29b-41d4-a716-446655440002', 'StartupXYZ', (SELECT id FROM public.plans WHERE type = 'basic' LIMIT 1));

-- Insert sample categories for companies
INSERT INTO public.categories (company_id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Hardware', 'Problemas relacionados a equipamentos'),
('550e8400-e29b-41d4-a716-446655440001', 'Software', 'Problemas em sistemas e aplicações'),
('550e8400-e29b-41d4-a716-446655440001', 'Rede', 'Conectividade e infraestrutura'),
('550e8400-e29b-41d4-a716-446655440002', 'Suporte Geral', 'Suporte geral aos usuários'),
('550e8400-e29b-41d4-a716-446655440002', 'Sistema', 'Problemas no sistema principal');