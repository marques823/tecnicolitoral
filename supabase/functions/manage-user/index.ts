import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action: 'reset_password' | 'change_email' | 'get_users' | 'delete_user';
  user_id?: string;
  new_password?: string;
  new_email?: string;
  company_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, user_id, new_password, new_email, company_id }: ManageUserRequest = await req.json();

    switch (action) {
      case 'reset_password':
        if (!user_id || !new_password) {
          throw new Error('User ID and new password are required');
        }

        // Verificar se o usuário existe antes de tentar atualizar
        const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (getUserError || !existingUser.user) {
          throw new Error('User not found in authentication system');
        }

        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          { password: new_password }
        );

        if (passwordError) throw passwordError;

        return new Response(
          JSON.stringify({ success: true, message: 'Password updated successfully' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'change_email':
        if (!user_id || !new_email) {
          throw new Error('User ID and new email are required');
        }

        // Verificar se o usuário existe antes de tentar atualizar
        const { data: existingUserEmail, error: getUserEmailError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (getUserEmailError || !existingUserEmail.user) {
          throw new Error('User not found in authentication system');
        }

        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          { email: new_email }
        );

        if (emailError) throw emailError;

        return new Response(
          JSON.stringify({ success: true, message: 'Email updated successfully' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'get_users':
        if (!company_id) {
          throw new Error('Company ID is required');
        }

        // Buscar perfis da empresa
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('company_id', company_id)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Buscar emails dos usuários e limpar dados órfãos
        const usersWithEmails = [];
        const orphanedProfiles = [];

        for (const profile of profiles || []) {
          try {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
            
            if (!userError && userData.user) {
              usersWithEmails.push({
                ...profile,
                user_email: userData.user.email
              });
            } else {
              // Usuário órfão - existe no profiles mas não no auth
              console.log(`Orphaned profile found: ${profile.id}, user_id: ${profile.user_id}`);
              orphanedProfiles.push(profile.id);
            }
          } catch (error) {
            console.error('Error fetching user email:', error);
            // Adicionar à lista de órfãos para limpeza
            orphanedProfiles.push(profile.id);
          }
        }

        // Limpar perfis órfãos (opcional - pode ser feito em background)
        if (orphanedProfiles.length > 0) {
          console.log(`Cleaning up ${orphanedProfiles.length} orphaned profiles`);
          try {
            await supabaseAdmin
              .from('profiles')
              .delete()
              .in('id', orphanedProfiles);
          } catch (cleanupError) {
            console.error('Error cleaning orphaned profiles:', cleanupError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, users: usersWithEmails }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'delete_user':
        if (!user_id) {
          throw new Error('User ID is required');
        }

        // Verificar se o usuário existe antes de tentar excluir
        const { data: existingUserDelete, error: getUserDeleteError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (getUserDeleteError || !existingUserDelete.user) {
          throw new Error('User not found in authentication system');
        }

        // Primeiro, excluir o perfil do usuário da tabela profiles
        const { error: profileDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', user_id);

        if (profileDeleteError) {
          console.error('Error deleting profile:', profileDeleteError);
          // Continua mesmo se der erro no perfil
        }

        // Depois, excluir o usuário do sistema de autenticação
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true, message: 'User deleted successfully' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in manage-user function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);