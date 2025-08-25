-- Criar tabela para comentários de tickets
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies para comentários
CREATE POLICY "Users can insert comments for their company tickets" 
ON public.ticket_comments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = ticket_comments.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
) AND user_id = auth.uid());

CREATE POLICY "Users can view comments from their company tickets" 
ON public.ticket_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = ticket_comments.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Client users can only view public comments" 
ON public.ticket_comments 
FOR SELECT 
USING (
  NOT is_private 
  AND EXISTS (
    SELECT 1 FROM tickets t 
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE t.id = ticket_comments.ticket_id 
    AND t.company_id = get_user_company_id(auth.uid())
    AND p.role = 'client_user'
    AND (t.created_by = auth.uid() OR t.client_id IN (
      SELECT c.id FROM clients c 
      WHERE c.email = COALESCE(p.email_contato, get_user_email(p.user_id))
    ))
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.ticket_comments 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_ticket_comments_updated_at
BEFORE UPDATE ON public.ticket_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar comentários no histórico
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

-- Trigger para registrar comentários no histórico
CREATE TRIGGER log_ticket_comment_history_trigger
AFTER INSERT OR UPDATE ON public.ticket_comments
FOR EACH ROW
EXECUTE FUNCTION public.log_ticket_comment_history();