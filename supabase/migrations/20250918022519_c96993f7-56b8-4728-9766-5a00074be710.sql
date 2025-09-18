-- Corrigir o trigger de comentários que está causando o erro
-- O trigger espera 'content' mas a tabela tem 'comment'
DROP TRIGGER IF EXISTS trigger_log_ticket_comment_history ON public.ticket_comments;

-- Recriar a função do trigger com o nome correto da coluna
CREATE OR REPLACE FUNCTION public.log_ticket_comment_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Recriar o trigger
CREATE TRIGGER trigger_log_ticket_comment_history
  AFTER INSERT OR UPDATE ON public.ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_comment_history();