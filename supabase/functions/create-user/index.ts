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
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      throw new Error('Configuração do servidor incompleta');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    let requestBody: CreateUserRequest;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Dados da requisição inválidos');
    }

    const { email, password, name, role, company_id, active } = requestBody;
    
    console.log('Parsed request data:', { 
      email, 
      name, 
      role, 
      company_id, 
      active,
      hasPassword: !!password 
    });

    // Validate required fields
    if (!email || !password || !name || !role || !company_id) {
      console.error('Missing required fields:', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasName: !!name,
        hasRole: !!role,
        hasCompanyId: !!company_id
      });
      throw new Error('Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      console.error('Password too short:', password.length);
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      throw new Error('Formato de email inválido');
    }

    // Check if user already exists
    console.log('Checking for existing users...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error('Erro ao verificar usuários existentes');
    }

    const userExists = existingUsers.users.some(u => u.email === email);
    
    if (userExists) {
      console.log('User already exists:', email);
      throw new Error('Usuário com este email já existe');
    }
    
    console.log('No existing user found, proceeding with creation');

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

    if (!authData.user) {
      console.error('No user data returned from auth creation');
      throw new Error('Erro ao criar usuário: dados de usuário não retornados');
    }

    console.log('User created in auth, ID:', authData.user.id);
    console.log('Creating profile...');

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
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
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