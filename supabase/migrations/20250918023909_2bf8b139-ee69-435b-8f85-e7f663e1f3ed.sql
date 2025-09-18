-- Corrigir o trigger que está causando erro com UUIDs vazios
CREATE OR REPLACE FUNCTION public.notify_ticket_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    notification_data jsonb;
BEGIN
    -- Construir dados da notificação
    IF TG_OP = 'INSERT' THEN
        notification_data := jsonb_build_object(
            'type', 'new_ticket',
            'ticket_id', NEW.id,
            'ticket_title', NEW.title,
            'ticket_description', NEW.description,
            'company_id', NEW.company_id,
            'created_by', NEW.created_by,
            'assigned_to', NEW.assigned_to,
            'priority', NEW.priority,
            'status', NEW.status
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Verificar se houve mudança de status
        IF OLD.status != NEW.status THEN
            notification_data := jsonb_build_object(
                'type', 'status_change',
                'ticket_id', NEW.id,
                'ticket_title', NEW.title,
                'company_id', NEW.company_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'created_by', NEW.created_by
            );
        -- Verificar se houve mudança de atribuição (corrigido para comparar UUIDs)
        ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            notification_data := jsonb_build_object(
                'type', 'assignment',
                'ticket_id', NEW.id,
                'ticket_title', NEW.title,
                'company_id', NEW.company_id,
                'old_assigned_to', OLD.assigned_to,
                'new_assigned_to', NEW.assigned_to,
                'created_by', NEW.created_by
            );
        END IF;
    END IF;

    -- Enviar notificação se houver dados
    IF notification_data IS NOT NULL THEN
        PERFORM net.http_post(
            url := 'https://krqhhjkdvgddaghkxwdg.supabase.co/functions/v1/send-notification-email',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycWhoamtkdmdkZGFnaGt4d2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODk2ODYsImV4cCI6MjA2MTI2NTY4Nn0.neWw9AgO9An4eu4nnzylgmtoulLSyubbI0ytcLixV7o"}'::jsonb,
            body := notification_data
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;