import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, AlertTriangle, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  user_email?: string;
}

interface EmailChangeModalProps {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
}

const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  user,
  open,
  onClose
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Aqui você pode implementar a lógica de troca de email
      // Por exemplo, através de uma edge function ou update direto
      const { error } = await supabase.auth.admin.updateUserById(
        user.user_id,
        { email: newEmail }
      );

      if (error) throw error;

      toast({
        title: "Email alterado",
        description: "O email do usuário foi alterado com sucesso.",
      });

      setNewEmail('');
      onClose();
    } catch (error: any) {
      console.error('Error changing email:', error);
      toast({
        title: "Erro ao alterar email",
        description: "Não foi possível alterar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Alterar Email</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Alterando email para:
                </p>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">
                  Email atual: {user.user_email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              O usuário precisará confirmar o novo email antes de poder fazer login.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="newEmail">Novo email</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleChangeEmail} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailChangeModal;