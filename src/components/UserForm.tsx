import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  role: 'master' | 'technician' | 'client';
  active: boolean;
}

interface UserFormProps {
  user?: UserProfile | null;
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, companyId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client' as 'master' | 'technician' | 'client',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: '', // Email não pode ser editado facilmente
        password: '', // Password vazio para edição
        role: user.role,
        active: user.active
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role,
            active: formData.active
          })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Usuário atualizado",
          description: "As informações do usuário foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo usuário via edge function
        if (!formData.email || !formData.password) {
          throw new Error('Email e senha são obrigatórios para novos usuários');
        }

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            company_id: companyId,
            active: formData.active
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erro ao criar usuário');
        }

        if (!data.success) {
          throw new Error(data.error || 'Erro ao criar usuário');
        }

        toast({
          title: "Usuário criado",
          description: "O novo usuário foi criado com sucesso.",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro ao salvar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'client', label: 'Cliente', description: 'Pode criar e visualizar seus próprios chamados' },
    { value: 'technician', label: 'Técnico', description: 'Pode gerenciar chamados da empresa' },
    { value: 'master', label: 'Master', description: 'Acesso total ao sistema da empresa' }
  ];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{user ? 'Editar Usuário' : 'Novo Usuário'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="name"
                    placeholder="Digite o nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!user && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha temporária</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      O usuário poderá alterar a senha no primeiro acesso
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Permissões</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'master' | 'technician' | 'client') => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="active">Usuário ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários inativos não podem fazer login
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t bg-white sticky bottom-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? 'Atualizar' : 'Criar'} Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;