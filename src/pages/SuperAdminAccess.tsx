import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, Key, Building, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminAccess() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    console.log('Iniciando processo de login...');
    
    try {
      console.log('Tentando fazer login com:', 'marques823+administrador@gmail.com');
      const { error } = await signIn('marques823+administrador@gmail.com', 'SuperAdmin123!');

      console.log('Resultado do signIn:', { error });

      if (error) {
        console.error('Erro detalhado no login:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          error: error
        });
        toast.error('Erro ao fazer login: ' + error.message);
        return;
      }

      console.log('Login bem-sucedido, redirecionando...');
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro inesperado capturado:', error);
      toast.error('Erro inesperado ao fazer login');
    } finally {
      console.log('Finalizando processo de login...');
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