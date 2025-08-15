-- Atualizar a senha do super admin para garantir que funcione
UPDATE auth.users 
SET 
  encrypted_password = crypt('SuperAdmin123!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'admin@ticketflow.com';