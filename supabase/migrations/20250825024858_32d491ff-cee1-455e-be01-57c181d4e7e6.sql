-- Corrigir função com search_path mutable
CREATE OR REPLACE FUNCTION public.log_ticket_comment_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
    VALUES (NEW.ticket_id, NEW.user_id, 'comment_added', 
      CASE 
        WHEN NEW.is_private THEN 'Comentário privado adicionado'
        ELSE 'Comentário adicionado'
      END);
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, description)
    VALUES (NEW.ticket_id, NEW.user_id, 'comment_updated', 'Comentário editado');
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;