-- Criar tabela para configurações de notificação dos usuários
CREATE TABLE public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_on_new_ticket BOOLEAN NOT NULL DEFAULT false,
  email_on_status_change BOOLEAN NOT NULL DEFAULT false,
  email_on_assignment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_notification_settings_user_id_unique UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notification settings" 
ON public.user_notification_settings 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification settings" 
ON public.user_notification_settings 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification settings" 
ON public.user_notification_settings 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Super admins podem ver todas as configurações
CREATE POLICY "Super admins can view all notification settings" 
ON public.user_notification_settings 
FOR SELECT 
USING (user_is_super_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_notification_settings_updated_at
BEFORE UPDATE ON public.user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();