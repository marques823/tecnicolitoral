-- Limpar usuários órfãos da tabela auth.users, mantendo apenas o admin
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Buscar o usuário admin que tem perfil
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'system_owner' 
    LIMIT 1;
    
    -- Deletar todos os usuários do auth.users exceto o admin
    DELETE FROM auth.users 
    WHERE id != admin_user_id;
    
    -- Log do resultado
    RAISE NOTICE 'Usuários órfãos removidos do auth.users. Mantido apenas admin: %', admin_user_id;
END $$;