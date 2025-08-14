-- Criar o usuário super admin diretamente no auth
-- Primeiro, vamos inserir na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  email_change_sent_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_confirm_status,
  banned_until,
  delete_request_time,
  is_sso_user,
  created_at,
  updated_at,
  is_anonymous,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@ticketflow.com',
  crypt('SuperAdmin123!', gen_salt('bf')),
  now(),
  now(),
  '',
  null,
  '',
  null,
  '',
  '',
  '',
  null,
  null,
  '',
  '',
  null,
  now(),
  0,
  null,
  null,
  false,
  now(),
  now(),
  false,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Super Administrador"}'
) ON CONFLICT (email) DO NOTHING;

-- Inserir o perfil para o super admin
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
ON CONFLICT (user_id) DO NOTHING;