import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { TicketNotificationEmail } from './_templates/ticket-notification.tsx';
import { ClientNotificationEmail } from './_templates/client-notification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'new_ticket' | 'status_change' | 'assignment' | 'new_comment';
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
  comment_user?: string;
  is_private?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔄 Processando notificação por email...');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notification: NotificationRequest = await req.json();
    console.log('📨 Dados da notificação:', notification);

    // Buscar informações do ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        categories (name),
        clients (name)
      `)
      .eq('id', notification.ticket_id)
      .single();

    // Buscar informações dos usuários separadamente para evitar problemas de RLS
    let createdByName = 'Usuário desconhecido';
    let assignedToName = null;

    if (ticketData && ticketData.created_by) {
      const { data: createdByUser } = await supabase.auth.admin.getUserById(ticketData.created_by);
      if (createdByUser.user?.email) {
        const { data: createdByProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', ticketData.created_by)
          .single();
        createdByName = createdByProfile?.name || createdByUser.user.email;
      }
    }

    if (ticketData && ticketData.assigned_to) {
      const { data: assignedToUser } = await supabase.auth.admin.getUserById(ticketData.assigned_to);
      if (assignedToUser.user?.email) {
        const { data: assignedToProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', ticketData.assigned_to)
          .single();
        assignedToName = assignedToProfile?.name || assignedToUser.user.email;
      }
    }

    if (ticketError || !ticketData) {
      console.error('❌ Erro ao buscar dados do ticket:', ticketError);
      throw new Error('Ticket não encontrado');
    }

    console.log('🎫 Dados do ticket:', ticketData);

    // Buscar configurações de notificação dos usuários relevantes
    const userIds = [];
    
    // Adicionar criador do ticket
    if (ticketData.created_by) userIds.push(ticketData.created_by);
    
    // Adicionar responsável atual
    if (ticketData.assigned_to) userIds.push(ticketData.assigned_to);
    
    // Se for mudança de atribuição, adicionar responsável anterior
    if (notification.type === 'assignment' && notification.old_assigned_to) {
      userIds.push(notification.old_assigned_to);
    }

   // Para novos tickets, adicionar todos os administradores e técnicos da empresa
  if (notification.type === 'new_ticket') {
    const { data: companyUsers, error: companyUsersError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('company_id', notification.company_id)
      .in('role', ['company_admin', 'technician'])
      .eq('active', true);

    if (companyUsers) {
      companyUsers.forEach(user => userIds.push(user.user_id));
    }
  }

  // Para mudanças de status, comentários e atribuições, sempre incluir o criador do ticket
  if (['status_change', 'new_comment', 'assignment'].includes(notification.type) && ticketData.created_by) {
    userIds.push(ticketData.created_by);
  }

    // Remover duplicatas
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      console.log('ℹ️ Nenhum usuário para notificar');
      return new Response(JSON.stringify({ success: true, message: 'Nenhum usuário para notificar' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Buscar configurações de notificação e emails dos usuários
    const { data: usersToNotify, error: usersError } = await supabase
      .from('user_notification_settings')
      .select('user_id, email_on_new_ticket, email_on_status_change, email_on_assignment, email_on_my_ticket_status_change, email_on_my_ticket_comments, email_on_my_ticket_resolved')
      .in('user_id', uniqueUserIds);

    if (usersError) {
      console.error('❌ Erro ao buscar configurações de notificação:', usersError);
      throw new Error('Erro ao buscar configurações de notificação');
    }

    console.log('👥 Usuários com configurações:', usersToNotify);

    // Buscar emails dos usuários no auth.users
    const emailPromises = usersToNotify?.map(async (userSetting) => {
      const { data: authUser, error } = await supabase.auth.admin.getUserById(userSetting.user_id);
      
      if (error || !authUser.user?.email) {
        console.error(`❌ Erro ao buscar email do usuário ${userSetting.user_id}:`, error);
        return null;
      }

      return {
        ...userSetting,
        email: authUser.user.email
      };
    }) || [];

    const usersWithEmails = (await Promise.all(emailPromises)).filter(Boolean);
    console.log('📧 Usuários com emails:', usersWithEmails);

    // Buscar perfis dos usuários para verificar roles
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .in('user_id', uniqueUserIds);

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError);
      throw new Error('Erro ao buscar perfis dos usuários');
    }

    // Filtrar usuários que devem receber a notificação baseado no tipo e role
    const filteredUsers = usersWithEmails.filter(user => {
      const profile = userProfiles?.find(p => p.user_id === user.user_id);
      const isClient = profile?.role === 'client_user';
      const isTicketOwner = user.user_id === notification.created_by;
      
      switch (notification.type) {
        case 'new_ticket':
          // Clientes não recebem notificação de novos tickets
          return !isClient && user.email_on_new_ticket;
        case 'status_change':
          // Clientes recebem apenas se for do próprio ticket
          if (isClient && isTicketOwner) {
            return user.email_on_my_ticket_status_change;
          }
          // Outros usuários recebem conforme configuração geral
          return !isClient && user.email_on_status_change;
        case 'assignment':
          // Clientes não recebem notificações de atribuição
          return !isClient && user.email_on_assignment;
        case 'new_comment':
          // Clientes recebem apenas se for comentário no próprio ticket e não for privado
          if (isClient && isTicketOwner && !notification.is_private) {
            return user.email_on_my_ticket_comments;
          }
          // Outros usuários recebem comentários públicos conforme configuração
          return !isClient && !notification.is_private && user.email_on_status_change;
        default:
          return false;
      }
    });

    console.log('🎯 Usuários filtrados para notificação:', filteredUsers);

    if (filteredUsers.length === 0) {
      console.log('ℹ️ Nenhum usuário tem esta notificação ativada');
      return new Response(JSON.stringify({ success: true, message: 'Nenhum usuário tem esta notificação ativada' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Buscar dados da empresa
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', notification.company_id)
      .single();

    const companyName = companyData?.name || 'Sistema de Tickets';

    // Enviar emails usando React Email
    const emailPromisesToSend = filteredUsers.map(async (user) => {
      try {
        const subject = getEmailSubject(notification, companyName);
        
        // Generate URLs
        const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
        const ticketUrl = `${baseUrl}/tickets/${notification.ticket_id}`;
        const dashboardUrl = `${baseUrl}/dashboard`;

        // Verificar se é cliente
        const userProfile = userProfiles?.find(p => p.user_id === user.user_id);
        const isClient = userProfile?.role === 'client_user';
        
        // Render React Email template baseado no tipo de usuário
        const htmlContent = isClient 
          ? await renderAsync(
              React.createElement(ClientNotificationEmail, {
                notificationType: notification.type,
                ticketTitle: notification.ticket_title,
                ticketId: notification.ticket_id,
                companyName: companyName,
                oldStatus: notification.old_status,
                newStatus: notification.new_status,
                ticketUrl: ticketUrl,
              })
            )
          : await renderAsync(
              React.createElement(TicketNotificationEmail, {
                type: notification.type,
                companyName: companyName,
                ticketId: notification.ticket_id,
                ticketTitle: notification.ticket_title,
                ticketDescription: notification.ticket_description,
                category: ticketData.categories?.name || 'Sem categoria',
                priority: ticketData.priority,
                status: ticketData.status,
                createdBy: createdByName,
                assignedTo: assignedToName,
                oldStatus: notification.old_status,
                newStatus: notification.new_status,
                oldAssignedTo: notification.old_assigned_to,
                newAssignedTo: notification.new_assigned_to,
            ticketUrl: ticketUrl,
            dashboardUrl: dashboardUrl,
            createdAt: ticketData.created_at,
          })
        );

        const emailResponse = await resend.emails.send({
          from: `${companyName} <noreply@resend.dev>`,
          to: [user.email],
          subject: subject,
          html: htmlContent,
        });

        console.log(`✅ Email enviado para ${user.email}:`, emailResponse);
        return { success: true, email: user.email, response: emailResponse };
      } catch (error) {
        console.error(`❌ Erro ao enviar email para ${user.email}:`, error);
        return { success: false, email: user.email, error: error.message };
      }
    });

    const emailResults = await Promise.all(emailPromisesToSend);
    console.log('📊 Resultados dos emails:', emailResults);

    const successCount = emailResults.filter(r => r.success).length;
    const failCount = emailResults.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      message: `${successCount} emails enviados com sucesso, ${failCount} falharam`,
      results: emailResults
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Erro na função de notificação:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getEmailSubject(notification: NotificationRequest, companyName: string): string {
  switch (notification.type) {
    case 'new_ticket':
      return `🎫 ${companyName} - Novo Ticket: ${notification.ticket_title}`;
    case 'status_change':
      return `🔄 ${companyName} - Status Alterado: ${notification.ticket_title}`;
    case 'assignment':
      return `👤 ${companyName} - Ticket Atribuído: ${notification.ticket_title}`;
    default:
      return `📋 ${companyName} - Atualização do Ticket: ${notification.ticket_title}`;
  }
}

serve(handler);