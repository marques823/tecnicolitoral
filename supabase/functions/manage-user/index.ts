import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action: 'reset_password' | 'change_email' | 'get_users';
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

        // Buscar emails dos usuários
        const usersWithEmails = [];
        for (const profile of profiles || []) {
          try {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
            
            if (!userError && userData.user) {
              usersWithEmails.push({
                ...profile,
                user_email: userData.user.email
              });
            } else {
              // Fallback se não conseguir buscar o email
              usersWithEmails.push({
                ...profile,
                user_email: `user${profile.user_id.slice(-4)}@example.com`
              });
            }
          } catch (error) {
            console.error('Error fetching user email:', error);
            usersWithEmails.push({
              ...profile,
              user_email: `user${profile.user_id.slice(-4)}@example.com`
            });
          }
        }

        return new Response(
          JSON.stringify({ success: true, users: usersWithEmails }),
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