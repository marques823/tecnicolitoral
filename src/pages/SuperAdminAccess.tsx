import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Key, Building } from 'lucide-react';

export default function SuperAdminAccess() {
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
                <p className="text-sm text-muted-foreground">admin@ticketflow.com</p>
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

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Este usuário tem acesso a todas as empresas do sistema
            </p>
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                ⚠️ Mantenha essas credenciais seguras
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}