import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Um email com instruções para redefinir sua senha foi enviado.',
      });

      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao redefinir senha',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/auth')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Redefinir Senha</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5" />
            <span>Redefinir Senha</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/auth')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Email
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}