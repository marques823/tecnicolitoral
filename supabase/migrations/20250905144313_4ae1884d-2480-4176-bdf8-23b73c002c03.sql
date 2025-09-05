-- First, let's check if the triggers exist and drop them temporarily to fix the issue
DROP TRIGGER IF EXISTS ticket_history_trigger ON public.tickets;
DROP TRIGGER IF EXISTS ticket_notification_trigger ON public.tickets;

-- Recreate the log_ticket_history trigger (this one should be safe)
CREATE TRIGGER ticket_history_trigger
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.log_ticket_history();

-- Remove the notification trigger temporarily to avoid JSON parsing issues
-- The notify_ticket_changes function has issues with service_role_key configuration
-- We'll leave it disabled for now to allow ticket creation to work