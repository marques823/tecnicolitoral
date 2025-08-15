-- Criar empresa para o super admin se não existir
INSERT INTO public.companies (
  id,
  name,
  plan_id,
  active,
  primary_color,
  secondary_color
) VALUES (
  '794de572-0c6d-4dcf-916e-428ac17c91a5',
  'TicketFlow Admin',
  (SELECT id FROM public.plans LIMIT 1), -- Usar o primeiro plano disponível
  true,
  '#2563eb',
  '#64748b'
) ON CONFLICT (id) DO NOTHING;

-- Criar perfil para o super admin
INSERT INTO public.profiles (
  user_id,
  company_id,
  name,
  role,
  active
) 
SELECT 
  u.id,
  '794de572-0c6d-4dcf-916e-428ac17c91a5',
  'Super Administrador',
  'super_admin',
  true
FROM auth.users u 
WHERE u.email = 'admin@ticketflow.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = u.id
);