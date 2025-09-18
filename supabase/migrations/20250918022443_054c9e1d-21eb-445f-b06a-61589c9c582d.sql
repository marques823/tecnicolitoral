-- Adicionar coluna deleted_at à tabela tickets para soft delete
ALTER TABLE public.tickets 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Atualizar as políticas RLS para excluir tickets deletados das consultas normais
DROP POLICY IF EXISTS "Masters and technicians can view all company tickets" ON public.tickets;
DROP POLICY IF EXISTS "Client users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Client users can view tickets assigned to their specific client" ON public.tickets;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON public.tickets;

-- Recriar políticas excluindo tickets deletados
CREATE POLICY "Masters and technicians can view all company tickets" 
ON public.tickets 
FOR SELECT 
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE ((profiles.user_id = auth.uid()) 
    AND (profiles.role = ANY (ARRAY['company_admin'::user_role, 'technician'::user_role])))
  ))
  AND deleted_at IS NULL
);

CREATE POLICY "Client users can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (created_by = auth.uid()) 
  AND (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE ((profiles.user_id = auth.uid()) 
    AND (profiles.role = 'client_user'::user_role))
  ))
  AND deleted_at IS NULL
);

CREATE POLICY "Client users can view tickets assigned to their specific client" 
ON public.tickets 
FOR SELECT 
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (client_id IS NOT NULL) 
  AND (EXISTS ( 
    SELECT 1 FROM (profiles p JOIN clients c ON ((c.email = COALESCE(p.email_contato, get_user_email(p.user_id))))) 
    WHERE ((p.user_id = auth.uid()) 
    AND (p.role = 'client_user'::user_role) 
    AND (c.id = tickets.client_id) 
    AND (c.company_id = p.company_id))
  ))
  AND deleted_at IS NULL
);

CREATE POLICY "Super admins can view all tickets" 
ON public.tickets 
FOR SELECT 
USING (user_is_super_admin(auth.uid()));

-- Criar política para permitir soft delete apenas para admins e técnicos
CREATE POLICY "Company admins and technicians can soft delete tickets" 
ON public.tickets 
FOR UPDATE 
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE ((profiles.user_id = auth.uid()) 
    AND (profiles.role = ANY (ARRAY['company_admin'::user_role, 'technician'::user_role])))
  ))
)
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Função para soft delete de ticket que registra no histórico
CREATE OR REPLACE FUNCTION public.soft_delete_ticket(ticket_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    ticket_exists boolean;
    user_company_id uuid;
BEGIN
    -- Verificar se o usuário tem permissão
    user_company_id := get_user_company_id(auth.uid());
    
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
    
    -- Registrar exclusão no histórico
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
    VALUES (ticket_uuid, auth.uid(), 'deleted', 'Ticket excluído (soft delete)');
    
    -- Fazer soft delete do ticket
    UPDATE public.tickets 
    SET deleted_at = now(), updated_at = now()
    WHERE id = ticket_uuid;
    
    RETURN true;
END;
$function$;