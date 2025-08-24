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
  role: 'company_admin' | 'technician' | 'client_user' | 'system_owner';
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
    role: 'client_user' as 'company_admin' | 'technician' | 'client_user' | 'system_owner',
    active: true,
    cpf_cnpj: '',
    razao_social: '',
    endereco: '',
    telefone: '',
    email_contato: ''
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
        active: user.active,
        cpf_cnpj: (user as any).cpf_cnpj || '',
        razao_social: (user as any).razao_social || '',
        endereco: (user as any).endereco || '',
        telefone: (user as any).telefone || '',
        email_contato: (user as any).email_contato || ''
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
            active: formData.active,
            cpf_cnpj: formData.cpf_cnpj || null,
            razao_social: formData.razao_social || null,
            endereco: formData.endereco || null,
            telefone: formData.telefone || null,
            email_contato: formData.email_contato || null
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

        console.log('Tentando criar usuário:', { 
          email: formData.email, 
          name: formData.name, 
          role: formData.role,
          company_id: companyId,
          active: formData.active 
        });

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            company_id: companyId,
            active: formData.active,
            cpf_cnpj: formData.cpf_cnpj || null,
            razao_social: formData.razao_social || null,
            endereco: formData.endereco || null,
            telefone: formData.telefone || null,
            email_contato: formData.email_contato || null
          }
        });

        console.log('Resposta da edge function:', { data, error });

        if (error) {
          console.error('Edge function error:', error);
          
          // Tentar obter mais detalhes do erro
          let errorMessage = 'Erro ao criar usuário';
          if (error.message) {
            errorMessage = error.message;
          }
          
          throw new Error(errorMessage);
        }

        if (!data || !data.success) {
          const errorMsg = data?.error || 'Erro desconhecido ao criar usuário';
          console.error('Edge function returned error:', errorMsg);
          throw new Error(errorMsg);
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
    { value: 'client_user', label: 'Cliente', description: 'Pode criar e visualizar seus próprios chamados' },
    { value: 'technician', label: 'Técnico', description: 'Pode gerenciar chamados da empresa' },
    { value: 'company_admin', label: 'Admin da Empresa', description: 'Acesso total ao sistema da empresa' }
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

        {/* Informações Adicionais para Clientes */}
        {formData.role === 'client_user' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações do Cliente</CardTitle>
              <CardDescription>Campos opcionais para clientes com login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  placeholder="Nome da empresa ou razão social"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  placeholder="Endereço completo"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contato">Email de Contato Alternativo</Label>
                <Input
                  id="email_contato"
                  type="email"
                  placeholder="email.alternativo@cliente.com (opcional)"
                  value={formData.email_contato}
                  onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Email diferente do login para contato
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
                  onValueChange={(value: 'company_admin' | 'technician' | 'client_user' | 'system_owner') => 
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