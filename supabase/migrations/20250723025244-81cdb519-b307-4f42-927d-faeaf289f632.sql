-- Remove a foreign key incorreta
ALTER TABLE tickets DROP CONSTRAINT tickets_created_by_fkey;

-- Adicionar a foreign key correta para referenciar auth.users
ALTER TABLE tickets ADD CONSTRAINT tickets_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Corrigir assigned_to para ser consistente (usar user_id ao invés de profile id)
ALTER TABLE tickets DROP CONSTRAINT tickets_assigned_to_fkey;

-- Adicionar foreign key correta para assigned_to
ALTER TABLE tickets ADD CONSTRAINT tickets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id);