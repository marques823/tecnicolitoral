-- Verificar se precisamos recriar o usuário com configurações corretas
-- Primeiro deletar o usuário existente se houver
DELETE FROM auth.users WHERE email = 'admin@ticketflow.com';

-- Recriar o usuário super admin com configurações corretas
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@ticketflow.com',
  crypt('SuperAdmin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Super Administrador"}',
  false
);

-- Recriar o perfil
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@ticketflow.com');

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
WHERE u.email = 'admin@ticketflow.com';