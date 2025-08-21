import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SuperAdminPromotion() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const promoteToSuperAdmin = async () => {
    if (!email) {
      toast.error('Digite um email válido');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('promote_to_super_admin', {
        user_email: email
      });

      if (error) {
        console.error('Erro ao promover usuário:', error);
        toast.error('Erro ao promover usuário: ' + error.message);
        return;
      }

      toast.success(`Usuário ${email} promovido a Super Admin com sucesso!`);
      setEmail('');
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao promover usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-destructive rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-destructive-foreground" />
        </div>
        <CardTitle className="text-destructive">Promoção Super Admin</CardTitle>
        <p className="text-sm text-muted-foreground">
          Promover usuário existente a Super Administrador
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email do usuário
          </label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && promoteToSuperAdmin()}
          />
        </div>
        
        <Button 
          onClick={promoteToSuperAdmin}
          disabled={isLoading || !email}
          variant="destructive"
          className="w-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? 'Promovendo...' : 'Promover a Super Admin'}
        </Button>
        
        <div className="text-xs text-muted-foreground bg-muted border rounded p-3">
          <p className="font-medium mb-1">⚠️ Instruções:</p>
          <p>1. O usuário deve estar registrado no sistema</p>
          <p>2. Após a promoção, ele terá acesso total</p>
          <p>3. Use apenas para administradores confiáveis</p>
        </div>
      </CardContent>
    </Card>
  );
}