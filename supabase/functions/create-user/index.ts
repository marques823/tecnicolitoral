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
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    // Client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    // Verify the JWT token and get user info
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) {
      console.error('User verification failed:', userError);
      throw new Error(`Unauthorized - ${userError.message}`);
    }
    
    if (!userData.user) {
      console.error('No user data returned');
      throw new Error('Unauthorized - No user data');
    }

    console.log('Verified user:', userData.user.email);

    // Check if current user is a master in their company
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, company_id')
      .eq('user_id', userData.user.id)
      .single();

    if (profileError || !currentProfile || currentProfile.role !== 'master') {
      console.error('Profile verification failed:', profileError, currentProfile);
      throw new Error('Only masters can create users');
    }

    console.log('Verified master user for company:', currentProfile.company_id);

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