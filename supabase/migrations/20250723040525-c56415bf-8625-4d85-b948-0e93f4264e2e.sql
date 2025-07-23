-- Criar tabela ticket_history se não existir
CREATE TABLE IF NOT EXISTS public.ticket_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela ticket_history
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;

-- Políticas para ticket_history
DROP POLICY IF EXISTS "Users can view ticket history from their company" ON public.ticket_history;
CREATE POLICY "Users can view ticket history from their company" 
ON public.ticket_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = ticket_history.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

-- Adicionar foreign keys se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ticket_history_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_history 
    ADD CONSTRAINT ticket_history_ticket_id_fkey 
    FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Garantir que a função existe e está correta
CREATE OR REPLACE FUNCTION log_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar criação do ticket
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, description)
    VALUES (NEW.id, auth.uid(), 'created', 'Ticket criado');
    RETURN NEW;
  END IF;

  -- Registrar mudanças de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, description, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', 'Status alterado', OLD.status::text, NEW.status::text);
  END IF;

  -- Registrar mudanças de prioridade
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, description, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_change', 'Prioridade alterada', OLD.priority::text, NEW.priority::text);
  END IF;

  -- Registrar mudanças de responsável
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, description, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assignment_change', 'Responsável alterado', 
            COALESCE(OLD.assigned_to::text, 'Não atribuído'), 
            COALESCE(NEW.assigned_to::text, 'Não atribuído'));
  END IF;

  -- Registrar resolução do ticket
  IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
    INSERT INTO ticket_history (ticket_id, user_id, action, description)
    VALUES (NEW.id, auth.uid(), 'resolved', 'Ticket resolvido');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS ticket_history_trigger ON public.tickets;

-- Criar triggers para INSERT e UPDATE
CREATE TRIGGER ticket_history_trigger
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_history();