-- Criar tabela para notas técnicas
CREATE TABLE public.technical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  ticket_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  tags TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para compartilhamentos
CREATE TABLE public.ticket_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  shared_by UUID NOT NULL,
  share_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.technical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_shares ENABLE ROW LEVEL SECURITY;

-- Políticas para technical_notes
CREATE POLICY "Users can view technical notes from their company" 
ON public.technical_notes 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create technical notes for their company" 
ON public.technical_notes 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their own technical notes" 
ON public.technical_notes 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Masters can manage all technical notes from their company" 
ON public.technical_notes 
FOR ALL 
USING (company_id = get_user_company_id(auth.uid()) AND user_has_master_role(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND user_has_master_role(auth.uid()));

-- Políticas para ticket_shares
CREATE POLICY "Users can view shares from their company tickets" 
ON public.ticket_shares 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = ticket_shares.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create shares for their company tickets" 
ON public.ticket_shares 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = ticket_shares.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
) AND shared_by = auth.uid());

CREATE POLICY "Users can manage their own shares" 
ON public.ticket_shares 
FOR ALL 
USING (shared_by = auth.uid())
WITH CHECK (shared_by = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_technical_notes_updated_at
BEFORE UPDATE ON public.technical_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar foreign keys
ALTER TABLE public.technical_notes 
ADD CONSTRAINT technical_notes_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.technical_notes 
ADD CONSTRAINT technical_notes_ticket_id_fkey 
FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_shares 
ADD CONSTRAINT ticket_shares_ticket_id_fkey 
FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

-- Função para registrar histórico de tickets
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para histórico de tickets
CREATE TRIGGER ticket_history_trigger
AFTER UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_history();