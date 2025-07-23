import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'master' | 'technician' | 'client';
  company_id: string;
  active: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE USER FUNCTION STARTED ===');
    
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const requestBody: CreateUserRequest = await req.json();
    const { email, password, name, role, company_id, active } = requestBody;
    
    console.log('Request data:', { email, name, role, company_id, active });

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers.users.some(u => u.email === email);
    
    if (userExists) {
      console.log('User already exists:', email);
      throw new Error('Usuário com este email já existe');
    }

    console.log('Creating user in auth...');

    // Create the user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('Auth creation failed:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    console.log('User created in auth, creating profile...');

    // Create the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        company_id,
        name,
        role,
        active
      });

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao criar perfil: ${profileError.message}`);
    }

    console.log('User and profile created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        message: 'Usuário criado com sucesso' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('=== ERROR IN CREATE-USER FUNCTION ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);