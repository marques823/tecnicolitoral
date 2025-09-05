import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ChangeEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um novo email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Um email de confirmação foi enviado para o novo endereço. Verifique sua caixa de entrada.',
      });

      navigate('/settings');
    } catch (error: any) {
      console.error('Erro ao alterar email:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Alterar Email</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Alterar Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Novo Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Digite seu novo email"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/settings')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Email
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}