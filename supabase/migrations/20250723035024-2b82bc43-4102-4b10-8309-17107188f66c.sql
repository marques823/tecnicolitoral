-- Corrigir o search_path da função log_ticket_history
CREATE OR REPLACE FUNCTION log_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
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

-- Função para gerar token de compartilhamento
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';