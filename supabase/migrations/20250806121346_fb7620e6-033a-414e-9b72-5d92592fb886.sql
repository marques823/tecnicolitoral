-- Remover temporariamente o trigger que pode estar causando o erro
DROP TRIGGER IF EXISTS notification_email_trigger ON public.tickets;

-- Remover a função também temporariamente
DROP FUNCTION IF EXISTS public.send_notification_email();