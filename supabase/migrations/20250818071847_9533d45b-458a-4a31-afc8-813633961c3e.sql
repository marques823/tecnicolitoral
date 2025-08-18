-- Remove o usuário super admin existente
DELETE FROM public.profiles WHERE role = 'super_admin';

-- Deletar o usuário auth se existir
DELETE FROM auth.users WHERE email = 'admin@ticketflow.com';

-- Criar novo usuário admin com email válido
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'marques823+administrador@gmail.com',
  crypt('SuperAdmin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  now()
);

-- Criar perfil super_admin para o novo usuário
INSERT INTO public.profiles (
  user_id,
  company_id,
  name,
  role,
  active
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'marques823+administrador@gmail.com'),
  (SELECT id FROM public.companies LIMIT 1),
  'Super Administrador',
  'super_admin',
  true
);