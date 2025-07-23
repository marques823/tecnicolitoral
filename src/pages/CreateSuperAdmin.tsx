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
      // Buscar a empresa TicketFlow Admin
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'TicketFlow Admin')
        .limit(1);

      if (!companies || companies.length === 0) {
        throw new Error('Empresa TicketFlow Admin não encontrada');
      }

      // Criar super admin usando a edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: 'admin@ticketflow.com',
          password: 'T84dy866n@',
          name: 'Administrador',
          role: 'super_admin',
          company_id: companies[0].id,
          active: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao criar super admin');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar super admin');
      }

      toast({
        title: "Super Admin criado!",
        description: "Email: admin@ticketflow.com | Senha: T84dy866n@",
      });

      console.log('Super admin criado com sucesso:', data);

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
              Senha: T84dy866n@
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