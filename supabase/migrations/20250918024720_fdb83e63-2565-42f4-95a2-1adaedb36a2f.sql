-- Corrigir a função notify_comment_changes para usar os campos corretos da tabela ticket_comments
CREATE OR REPLACE FUNCTION public.notify_comment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            'comment_content', NEW.comment,
            'comment_author', NEW.user_id,
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
$function$;