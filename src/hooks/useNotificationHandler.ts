import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  type: 'new_ticket' | 'status_change' | 'assignment';
  ticket_id: string;
  ticket_title: string;
  ticket_description?: string;
  old_status?: string;
  new_status?: string;
  old_assigned_to?: string;
  new_assigned_to?: string;
  created_by?: string;
  assigned_to?: string;
  updated_by?: string;
  company_id: string;
}

export const useNotificationHandler = () => {
  useEffect(() => {
    console.log('🔔 Iniciando listener de notificações...');

    // Escutar notificações do banco
    const channel = supabase
      .channel('ticket_notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        async (payload) => {
          console.log('🎫 Mudança detectada no ticket:', payload);
          
          // Determinar tipo de notificação
          let notificationData: Partial<NotificationData> = {
            ticket_id: (payload.new as any)?.id || (payload.old as any)?.id,
            ticket_title: (payload.new as any)?.title || (payload.old as any)?.title,
            company_id: (payload.new as any)?.company_id || (payload.old as any)?.company_id
          };

          if (payload.eventType === 'INSERT') {
            notificationData = {
              ...notificationData,
              type: 'new_ticket',
              ticket_description: (payload.new as any)?.description,
              created_by: (payload.new as any)?.created_by,
              assigned_to: (payload.new as any)?.assigned_to
            };
          } else if (payload.eventType === 'UPDATE') {
            // Verificar se houve mudança de status
            if ((payload.old as any)?.status !== (payload.new as any)?.status) {
              notificationData = {
                ...notificationData,
                type: 'status_change',
                old_status: (payload.old as any)?.status,
                new_status: (payload.new as any)?.status,
                assigned_to: (payload.new as any)?.assigned_to,
                created_by: (payload.new as any)?.created_by
              };
            }
            // Verificar se houve mudança de atribuição
            else if ((payload.old as any)?.assigned_to !== (payload.new as any)?.assigned_to) {
              notificationData = {
                ...notificationData,
                type: 'assignment',
                old_assigned_to: (payload.old as any)?.assigned_to,
                new_assigned_to: (payload.new as any)?.assigned_to,
                created_by: (payload.new as any)?.created_by
              };
            }
          }

          // Enviar notificação por email se houver tipo definido
          if (notificationData.type) {
            try {
              console.log('📧 Enviando notificação por email:', notificationData);
              
              const { data, error } = await supabase.functions.invoke('send-notification-email', {
                body: notificationData
              });

              if (error) {
                console.error('❌ Erro ao enviar notificação:', error);
              } else {
                console.log('✅ Notificação enviada:', data);
              }
            } catch (error) {
              console.error('❌ Erro ao chamar função de notificação:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Removendo listener de notificações...');
      supabase.removeChannel(channel);
    };
  }, []);
};

export default useNotificationHandler;