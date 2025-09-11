-- Criar trigger para notificações de tickets
CREATE TRIGGER notify_ticket_changes_trigger
    AFTER INSERT OR UPDATE ON public.tickets
    FOR EACH ROW 
    EXECUTE FUNCTION public.notify_ticket_changes();