-- Verificar e corrigir a função soft_delete_ticket
CREATE OR REPLACE FUNCTION public.soft_delete_ticket(ticket_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    ticket_exists boolean;
    user_company_id uuid;
    current_user_id uuid;
BEGIN
    -- Obter o ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se o usuário tem permissão
    user_company_id := get_user_company_id(current_user_id);
    
    IF user_company_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não tem empresa associada';
    END IF;
    
    -- Verificar se o ticket existe e pertence à empresa do usuário
    SELECT EXISTS(
        SELECT 1 FROM tickets 
        WHERE id = ticket_uuid 
        AND company_id = user_company_id
        AND deleted_at IS NULL
    ) INTO ticket_exists;
    
    IF NOT ticket_exists THEN
        RAISE EXCEPTION 'Ticket não encontrado ou já foi excluído';
    END IF;
    
    -- Registrar exclusão no histórico primeiro
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
    VALUES (ticket_uuid, current_user_id, 'deleted', 'Ticket excluído (soft delete)');
    
    -- Fazer soft delete do ticket usando UPDATE sem verificar RLS
    UPDATE public.tickets 
    SET deleted_at = now(), updated_at = now()
    WHERE id = ticket_uuid
    AND company_id = user_company_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao excluir ticket: %', SQLERRM;
END;
$function$;