-- Criar trigger para notificações de ticket
CREATE OR REPLACE FUNCTION public.notify_ticket_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  notification_payload json;
BEGIN
  -- Notificar sobre novo ticket
  IF TG_OP = 'INSERT' THEN
    notification_payload := json_build_object(
      'type', 'new_ticket',
      'ticket_id', NEW.id,
      'ticket_title', NEW.title,
      'ticket_description', NEW.description,
      'created_by', NEW.created_by,
      'assigned_to', NEW.assigned_to,
      'company_id', NEW.company_id
    );
    
    -- Usar pg_notify para notificações em tempo real
    PERFORM pg_notify('ticket_notification', notification_payload::text);
    
    RETURN NEW;
  END IF;

  -- Notificar sobre mudanças
  IF TG_OP = 'UPDATE' THEN
    -- Notificar mudança de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      notification_payload := json_build_object(
        'type', 'status_change',
        'ticket_id', NEW.id,
        'ticket_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'updated_by', auth.uid(),
        'assigned_to', NEW.assigned_to,
        'created_by', NEW.created_by,
        'company_id', NEW.company_id
      );
      
      PERFORM pg_notify('ticket_notification', notification_payload::text);
    END IF;

    -- Notificar mudança de atribuição
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      notification_payload := json_build_object(
        'type', 'assignment',
        'ticket_id', NEW.id,
        'ticket_title', NEW.title,
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to,
        'updated_by', auth.uid(),
        'created_by', NEW.created_by,
        'company_id', NEW.company_id
      );
      
      PERFORM pg_notify('ticket_notification', notification_payload::text);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

-- Criar triggers para tabela tickets
DROP TRIGGER IF EXISTS trigger_notify_ticket_changes ON public.tickets;
CREATE TRIGGER trigger_notify_ticket_changes
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_changes();

-- Criar trigger para notificações de comentários
CREATE OR REPLACE FUNCTION public.notify_comment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  notification_payload json;
  ticket_data record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Buscar dados do ticket
    SELECT id, title, company_id, created_by 
    INTO ticket_data
    FROM public.tickets 
    WHERE id = NEW.ticket_id;
    
    notification_payload := json_build_object(
      'type', 'new_comment',
      'ticket_id', ticket_data.id,
      'ticket_title', ticket_data.title,
      'company_id', ticket_data.company_id,
      'created_by', ticket_data.created_by,
      'comment_user', NEW.user_id,
      'is_private', NEW.is_private
    );
    
    PERFORM pg_notify('comment_notification', notification_payload::text);
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Criar trigger para comentários
DROP TRIGGER IF EXISTS trigger_notify_comment_changes ON public.ticket_comments;
CREATE TRIGGER trigger_notify_comment_changes
  AFTER INSERT ON public.ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_changes();