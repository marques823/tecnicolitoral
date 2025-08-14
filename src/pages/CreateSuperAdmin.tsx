import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User } from 'lucide-react';

export default function CreateSuperAdmin() {
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const createSuperAdmin = async () => {
    setCreating(true);
    try {
      // Usar o ID da empresa TicketFlow Admin diretamente
      const companyId = '794de572-0c6d-4dcf-916e-428ac17c91a5';

      console.log('Verificando se perfil super admin já existe...');

      // Verificar se já existe um perfil super admin
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'super_admin')
        .eq('company_id', companyId)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao verificar perfil:', profileError);
        throw new Error(`Erro ao verificar perfil: ${profileError.message}`);
      }

      if (existingProfile) {
        console.log('Super admin já existe:', existingProfile);
        toast({
          title: "Super Admin já existe!",
          description: "Use as credenciais: admin@ticketflow.com | SuperAdmin123!",
        });
        return;
      }

      console.log('Verificando se usuário auth existe...');

      // Verificar se o usuário auth existe
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Erro ao listar usuários:', listError);
        throw new Error('Erro ao verificar usuários existentes');
      }
      
      const existingAuthUser = authUsers.users.find((user: any) => user.email === 'admin@ticketflow.com');

      if (existingAuthUser) {
        console.log('Usuário auth existe, criando apenas o perfil...');
        
        // Criar apenas o perfil para o usuário existente
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: existingAuthUser.id,
            company_id: companyId,
            name: 'Super Administrador',
            role: 'super_admin',
            active: true
          });

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          throw new Error(`Erro ao criar perfil: ${insertError.message}`);
        }

        toast({
          title: "Super Admin configurado!",
          description: "Perfil criado! Use: admin@ticketflow.com | SuperAdmin123!",
        });
        return;
      }

      console.log('Usuário não existe, criando novo...');

      // Criar super admin usando a edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: 'admin@ticketflow.com',
          password: 'SuperAdmin123!',
          name: 'Super Administrador',
          role: 'super_admin',
          company_id: companyId,
          active: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao criar super admin');
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || 'Erro desconhecido ao criar super admin';
        console.error('Edge function returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      toast({
        title: "Super Admin criado com sucesso!",
        description: "Email: admin@ticketflow.com | Senha: SuperAdmin123!",
      });

    } catch (error: any) {
      console.error('Erro ao criar super admin:', error);
      toast({
        title: "Erro ao criar Super Admin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Criar Super Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>admin@ticketflow.com</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Senha: SuperAdmin123!
            </div>
          </div>

          <Button 
            onClick={createSuperAdmin} 
            disabled={creating}
            className="w-full"
          >
            {creating ? 'Criando...' : 'Criar Super Admin'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Este usuário terá acesso a todas as empresas do sistema
          </p>
        </CardContent>
      </Card>
    </div>
  );
}