-- Corrigir a função para usar schema completo
CREATE OR REPLACE FUNCTION log_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar criação do ticket
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
    VALUES (NEW.id, auth.uid(), 'created', 'Ticket criado');
    RETURN NEW;
  END IF;

  -- Registrar mudanças de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', 'Status alterado', OLD.status::text, NEW.status::text);
  END IF;

  -- Registrar mudanças de prioridade
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_change', 'Prioridade alterada', OLD.priority::text, NEW.priority::text);
  END IF;

  -- Registrar mudanças de responsável
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assignment_change', 'Responsável alterado', 
            COALESCE(OLD.assigned_to::text, 'Não atribuído'), 
            COALESCE(NEW.assigned_to::text, 'Não atribuído'));
  END IF;

  -- Registrar resolução do ticket
  IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
    VALUES (NEW.id, auth.uid(), 'resolved', 'Ticket resolvido');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;