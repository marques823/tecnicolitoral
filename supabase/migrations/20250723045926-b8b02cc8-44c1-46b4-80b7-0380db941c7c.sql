-- Criar usuário super admin diretamente no auth
-- Nota: Este é um processo especial para criar o primeiro super admin

-- Inserir usuário no auth.users (método simplificado para desenvolvimento)
INSERT INTO auth.users (
  id,
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud,
  confirmation_token
) VALUES (
  gen_random_uuid(),
  'admin@ticketflow.com',
  crypt('T84dy866n@', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Administrador"}',
  'authenticated',
  'authenticated',
  ''
) 
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Criar perfil super admin
-- Primeiro vamos buscar o ID do usuário criado
DO $$
DECLARE
    user_uuid uuid;
    company_uuid uuid;
BEGIN
    -- Buscar o usuário admin
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'admin@ticketflow.com';
    
    -- Se o usuário existe, verificar se já tem perfil
    IF user_uuid IS NOT NULL THEN
        -- Verificar se já existe perfil
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = user_uuid) THEN
            -- Buscar uma empresa existente para associar (ou usar a primeira)
            SELECT id INTO company_uuid FROM companies LIMIT 1;
            
            -- Se não há empresas, criar uma empresa para o super admin
            IF company_uuid IS NULL THEN
                -- Buscar um plano para a empresa
                SELECT id INTO company_uuid FROM plans LIMIT 1;
                
                INSERT INTO companies (name, plan_id, active) 
                VALUES ('TicketFlow Admin', company_uuid, true)
                RETURNING id INTO company_uuid;
            END IF;
            
            -- Criar perfil super admin
            INSERT INTO profiles (user_id, company_id, name, role, active)
            VALUES (user_uuid, company_uuid, 'Administrador', 'super_admin', true);
        END IF;
    END IF;
END $$;