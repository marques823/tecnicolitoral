-- Corrigir função de notificação para usar a variável de ambiente correta
CREATE OR REPLACE FUNCTION public.notify_ticket_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  notification_payload json;
  service_role_key text;
BEGIN
  -- Obter a chave do service role do ambiente
  service_role_key := current_setting('supabase.service_role_key', true);
  
  -- Se não conseguir obter a chave, não tentar enviar email
  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE LOG 'Service role key not found, skipping email notification';
    RETURN COALESCE(NEW, OLD);
  END IF;

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
    
    -- Chamar edge function para envio de email apenas se tiver a chave
    BEGIN
      PERFORM net.http_post(
        url := 'https://krqhhjkdvgddaghkxwdg.supabase.co/functions/v1/send-notification-email',
        headers := json_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        )::jsonb,
        body := notification_payload::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Failed to send email notification: %', SQLERRM;
    END;
    
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
      
      BEGIN
        PERFORM net.http_post(
          url := 'https://krqhhjkdvgddaghkxwdg.supabase.co/functions/v1/send-notification-email',
          headers := json_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
          )::jsonb,
          body := notification_payload::jsonb
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send email notification: %', SQLERRM;
      END;
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
      
      BEGIN
        PERFORM net.http_post(
          url := 'https://krqhhjkdvgddaghkxwdg.supabase.co/functions/v1/send-notification-email',
          headers := json_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
          )::jsonb,
          body := notification_payload::jsonb
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send email notification: %', SQLERRM;
      END;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;