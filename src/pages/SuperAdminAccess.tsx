import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, Key, Building, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SuperAdminAccess() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    console.log('Iniciando acesso direto ao super admin...');
    
    try {
      // Verificar se há super admin no sistema usando o ID que já sabemos que existe
      console.log('Verificando super admin existente...');
      
      const { data: superAdmin, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', '8437f36d-ec5a-4b78-9be6-dc967a109cd2') // ID do super admin existente
        .eq('active', true)
        .eq('role', 'super_admin')
        .maybeSingle();

      console.log('Resultado da consulta super admin:', { superAdmin, queryError });

      if (queryError) {
        console.error('Erro ao buscar super admin:', queryError);
        toast.error('Erro ao verificar acesso: ' + queryError.message);
        return;
      }

      if (!superAdmin) {
        toast.error('Super admin não encontrado ou inativo.');
        console.log('Tentando buscar qualquer super admin ativo...');
        
        // Buscar qualquer super admin ativo
        const { data: anyAdmin, error: anyError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'super_admin')
          .eq('active', true)
          .limit(1);
          
        console.log('Resultado busca qualquer admin:', { anyAdmin, anyError });
        
        if (anyError || !anyAdmin || anyAdmin.length === 0) {
          toast.error('Nenhum super admin ativo encontrado no sistema.');
          return;
        }
        
        // Usar o primeiro super admin encontrado
        const adminToUse = anyAdmin[0];
        console.log('Usando super admin:', adminToUse);
        
        // Criar sessão temporária
        const adminData = {
          user_id: adminToUse.user_id,
          company_id: adminToUse.company_id,
          role: adminToUse.role,
          name: adminToUse.name,
          timestamp: Date.now()
        };
        
        localStorage.setItem('temp_super_admin', JSON.stringify(adminData));
        toast.success('Acesso super admin ativado!');
        navigate('/dashboard');
        return;
      }

      // Super admin específico encontrado
      console.log('Super admin encontrado:', superAdmin);
      
      const adminData = {
        user_id: superAdmin.user_id,
        company_id: superAdmin.company_id,
        role: superAdmin.role,
        name: superAdmin.name,
        timestamp: Date.now()
      };
      
      localStorage.setItem('temp_super_admin', JSON.stringify(adminData));
      toast.success('Acesso super admin ativado!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao acessar o sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Acesso Super Admin</CardTitle>
          <p className="text-sm text-muted-foreground">
            Credenciais para acesso ao sistema como Super Administrador
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">marques823+administrador@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Senha</p>
                <p className="text-sm text-muted-foreground">SuperAdmin123!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-sm text-muted-foreground">TicketFlow Admin</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Fazendo login...' : 'Fazer Login como Super Admin'}
            </Button>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Este usuário tem acesso a todas as empresas do sistema
              </p>
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  ⚠️ Mantenha essas credenciais seguras
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}