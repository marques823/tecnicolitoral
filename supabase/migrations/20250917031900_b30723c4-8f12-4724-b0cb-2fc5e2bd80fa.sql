-- Recriar triggers de notificação para tickets e comentários

-- Função para enviar notificações de tickets
CREATE OR REPLACE FUNCTION public.notify_ticket_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
                'updated_by', NEW.updated_by
            );
        -- Verificar se houve mudança de atribuição
        ELSIF COALESCE(OLD.assigned_to, '') != COALESCE(NEW.assigned_to, '') THEN
            notification_data := jsonb_build_object(
                'type', 'assignment',
                'ticket_id', NEW.id,
                'ticket_title', NEW.title,
                'company_id', NEW.company_id,
                'old_assigned_to', OLD.assigned_to,
                'new_assigned_to', NEW.assigned_to,
                'updated_by', NEW.updated_by
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
$$;

-- Função para enviar notificações de comentários
CREATE OR REPLACE FUNCTION public.notify_comment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    notification_data jsonb;
    ticket_info record;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Buscar informações do ticket
        SELECT id, title, company_id, created_by 
        INTO ticket_info
        FROM public.tickets 
        WHERE id = NEW.ticket_id;

        notification_data := jsonb_build_object(
            'type', 'new_comment',
            'ticket_id', NEW.ticket_id,
            'ticket_title', ticket_info.title,
            'company_id', ticket_info.company_id,
            'comment_content', NEW.content,
            'comment_author', NEW.author_id,
            'created_by', ticket_info.created_by
        );

        -- Enviar notificação
        PERFORM net.http_post(
            url := 'https://krqhhjkdvgddaghkxwdg.supabase.co/functions/v1/send-notification-email',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycWhoamtkdmdkZGFnaGt4d2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODk2ODYsImV4cCI6MjA2MTI2NTY4Nn0.neWw9AgO9An4eu4nnzylgmtoulLSyubbI0ytcLixV7o"}'::jsonb,
            body := notification_data
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Remover triggers existentes se houverem
DROP TRIGGER IF EXISTS trigger_ticket_notifications ON public.tickets;
DROP TRIGGER IF EXISTS trigger_comment_notifications ON public.ticket_comments;

-- Criar triggers
CREATE TRIGGER trigger_ticket_notifications
    AFTER INSERT OR UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_ticket_changes();

CREATE TRIGGER trigger_comment_notifications
    AFTER INSERT ON public.ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_comment_changes();