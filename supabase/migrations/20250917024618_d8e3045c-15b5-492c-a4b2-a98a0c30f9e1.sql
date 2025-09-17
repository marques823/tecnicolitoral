-- Adicionar novas configurações de notificação para clientes
ALTER TABLE public.user_notification_settings 
ADD COLUMN email_on_my_ticket_status_change boolean NOT NULL DEFAULT true,
ADD COLUMN email_on_my_ticket_comments boolean NOT NULL DEFAULT true,
ADD COLUMN email_on_my_ticket_resolved boolean NOT NULL DEFAULT true;