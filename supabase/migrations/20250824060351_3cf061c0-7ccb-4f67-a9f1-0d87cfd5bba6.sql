-- Primeiro, remover o valor padrão da coluna role
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Renomear enum antigo
ALTER TYPE user_role RENAME TO user_role_old;

-- Criar novo enum com roles organizados
CREATE TYPE user_role AS ENUM ('system_owner', 'company_admin', 'technician', 'client_user');

-- Atualizar tabela profiles com novos roles
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING (
  CASE role::text
    WHEN 'super_admin' THEN 'system_owner'::user_role
    WHEN 'master' THEN 'company_admin'::user_role
    WHEN 'client' THEN 'client_user'::user_role
    WHEN 'technician' THEN 'technician'::user_role
    ELSE 'client_user'::user_role
  END
);

-- Definir novo valor padrão
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'client_user'::user_role;

-- Remover enum antigo
DROP TYPE user_role_old;