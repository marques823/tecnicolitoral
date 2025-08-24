import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  role: 'master' | 'technician' | 'client' | 'super_admin';
  name: string;
  active: boolean;
}

interface Company {
  id: string;
  name: string;
  plan_id: string;
  active: boolean;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_css?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            try {
              console.log('🔐 Carregando dados do usuário:', session.user.id);
              
              // Fetch user profile
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (profileError) {
                console.error('Error fetching profile:', profileError);
                setLoading(false);
                return;
              }

              console.log('👤 Perfil carregado:', profileData);
              setProfile(profileData);

              // Se é super admin, mostrar notificação
              if (profileData?.role === 'super_admin') {
                toast.success('🛡️ Acesso Super Admin ativado!');
              }

              // Fetch company data
              if (profileData?.company_id) {
                console.log('🏢 Carregando empresa:', profileData.company_id);
                const { data: companyData, error: companyError } = await supabase
                  .from('companies')
                  .select('*')
                  .eq('id', profileData.company_id)
                  .single();

                if (!companyError && companyData) {
                  console.log('✅ Empresa carregada:', companyData);
                  setCompany(companyData);
                } else {
                  console.error('❌ Erro ao carregar empresa:', companyError);
                }
              }
              
              setLoading(false);
            } catch (error) {
              console.error('Error fetching user data:', error);
              setLoading(false);
            }
          }, 0);
        } else {
          console.log('🚪 Usuário deslogado');
          setProfile(null);
          setCompany(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      }

      return { error };
    } catch (error: any) {
      toast.error("Ocorreu um erro inesperado");
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/plan-selection`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          }
        }
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user && !data.session) {
        toast.success("Verifique seu email para confirmar a conta");
      } else if (data.session) {
        // Usuário logado automaticamente (confirmação de email desabilitada)
        toast.success("Cadastro realizado com sucesso! Bem-vindo ao TicketFlow");
      }

      return { error };
    } catch (error: any) {
      toast.error("Ocorreu um erro inesperado");
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
  };

const refreshAuthData = async () => {
  if (!user) return;
  setLoading(true);
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error refreshing profile:', profileError);
    } else {
      setProfile(profileData);
      if (profileData?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single();
        if (!companyError && companyData) {
          setCompany(companyData);
        }
      }
    }
  } catch (error) {
    console.error('Error refreshing auth data:', error);
  } finally {
    setLoading(false);
  }
};

const value = {
  user,
  session,
  profile,
  company,
  loading,
  signIn,
  signUp,
  signOut,
  refreshAuthData,
};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};