-- Criar função para enviar notificações de forma assíncrona
CREATE OR REPLACE FUNCTION public.notify_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar sobre novo ticket
  IF TG_OP = 'INSERT' THEN
    -- Usar pg_notify para enviar notificação assíncrona
    PERFORM pg_notify(
      'ticket_notification',
      json_build_object(
        'type', 'new_ticket',
        'ticket_id', NEW.id,
        'ticket_title', NEW.title,
        'ticket_description', NEW.description,
        'created_by', NEW.created_by,
        'assigned_to', NEW.assigned_to,
        'company_id', NEW.company_id
      )::text
    );
    RETURN NEW;
  END IF;

  -- Notificar sobre mudanças
  IF TG_OP = 'UPDATE' THEN
    -- Notificar mudança de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM pg_notify(
        'ticket_notification',
        json_build_object(
          'type', 'status_change',
          'ticket_id', NEW.id,
          'ticket_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'updated_by', auth.uid(),
          'assigned_to', NEW.assigned_to,
          'created_by', NEW.created_by,
          'company_id', NEW.company_id
        )::text
      );
    END IF;

    -- Notificar mudança de atribuição
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      PERFORM pg_notify(
        'ticket_notification',
        json_build_object(
          'type', 'assignment',
          'ticket_id', NEW.id,
          'ticket_title', NEW.title,
          'old_assigned_to', OLD.assigned_to,
          'new_assigned_to', NEW.assigned_to,
          'updated_by', auth.uid(),
          'created_by', NEW.created_by,
          'company_id', NEW.company_id
        )::text
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger usando a nova função
CREATE TRIGGER ticket_notification_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_changes();