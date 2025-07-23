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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Client for user verification
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the current user is authenticated and is a master
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser.user) {
      throw new Error('Unauthorized');
    }

    // Check if current user is a master in their company
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('user_id', currentUser.user.id)
      .single();

    if (profileError || !currentProfile || currentProfile.role !== 'master') {
      throw new Error('Only masters can create users');
    }

    const { email, password, name, role, company_id, active }: CreateUserRequest = await req.json();

    // Verify the company_id matches the current user's company
    if (company_id !== currentProfile.company_id) {
      throw new Error('Cannot create users for other companies');
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email === email);
    
    if (userExists) {
      throw new Error('User with this email already exists');
    }

    console.log('Creating user with email:', email);

    // Create the user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created in auth, creating profile...');

    // Create the profile
    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        company_id,
        name,
        role,
        active
      });

    if (profileCreateError) {
      console.error('Profile creation error:', profileCreateError);
      // If profile creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileCreateError;
    }

    console.log('User and profile created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        message: 'User created successfully' 
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
    console.error('Error in create-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
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