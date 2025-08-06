import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
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

    // Buscar informações do ticket e usuários relevantes
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        categories (name),
        profiles!tickets_created_by_fkey (name, user_id),
        assigned_profile:profiles!tickets_assigned_to_fkey (name, user_id)
      `)
      .eq('id', notification.ticket_id)
      .single();

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
      .select(`
        *,
        profiles!user_notification_settings_user_id_fkey (name, user_id)
      `)
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

    // Filtrar usuários que devem receber a notificação baseado no tipo
    const filteredUsers = usersWithEmails.filter(user => {
      switch (notification.type) {
        case 'new_ticket':
          return user.email_on_new_ticket;
        case 'status_change':
          return user.email_on_status_change;
        case 'assignment':
          return user.email_on_assignment;
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

    // Enviar emails
    const emailPromisesToSend = filteredUsers.map(async (user) => {
      try {
        const subject = getEmailSubject(notification, companyName);
        const htmlContent = getEmailContent(notification, ticketData, companyName);

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
      return `${companyName} - Novo Ticket: ${notification.ticket_title}`;
    case 'status_change':
      return `${companyName} - Status Alterado: ${notification.ticket_title}`;
    case 'assignment':
      return `${companyName} - Ticket Atribuído: ${notification.ticket_title}`;
    default:
      return `${companyName} - Atualização do Ticket: ${notification.ticket_title}`;
  }
}

function getEmailContent(notification: NotificationRequest, ticketData: any, companyName: string): string {
  const ticketUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/tickets`;
  
  let content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">${companyName}</h2>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e293b;">Ticket #${ticketData.id.substring(0, 8)}</h3>
        <p><strong>Título:</strong> ${notification.ticket_title}</p>
        <p><strong>Categoria:</strong> ${ticketData.categories?.name || 'N/A'}</p>
        <p><strong>Prioridade:</strong> ${ticketData.priority}</p>
        <p><strong>Status:</strong> ${ticketData.status}</p>
        <p><strong>Criado por:</strong> ${ticketData.profiles?.name || 'N/A'}</p>
        ${ticketData.assigned_profile ? `<p><strong>Responsável:</strong> ${ticketData.assigned_profile.name}</p>` : ''}
      </div>
  `;

  switch (notification.type) {
    case 'new_ticket':
      content += `
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
          <h4 style="margin-top: 0; color: #047857;">📝 Novo Ticket Criado</h4>
          <p>Um novo ticket foi criado no sistema.</p>
          ${notification.ticket_description ? `<p><strong>Descrição:</strong> ${notification.ticket_description}</p>` : ''}
        </div>
      `;
      break;
    case 'status_change':
      content += `
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
          <h4 style="margin-top: 0; color: #1d4ed8;">🔄 Status Alterado</h4>
          <p>O status do ticket foi alterado:</p>
          <p><strong>De:</strong> ${notification.old_status} <strong>Para:</strong> ${notification.new_status}</p>
        </div>
      `;
      break;
    case 'assignment':
      content += `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">👤 Ticket Atribuído</h4>
          <p>O responsável pelo ticket foi alterado.</p>
        </div>
      `;
      break;
  }

  content += `
      <div style="margin-top: 30px; text-align: center;">
        <a href="${ticketUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver Ticket
        </a>
      </div>
      <div style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Este é um email automático do sistema de tickets do ${companyName}.</p>
      </div>
    </div>
  `;

  return content;
}

serve(handler);