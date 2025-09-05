import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, Loader2 } from 'lucide-react';

export default function UserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [userData, setUserData] = useState<{
    name: string;
    role: 'system_owner' | 'company_admin' | 'technician' | 'client_user';
    active: boolean;
    cpf_cnpj: string;
    razao_social: string;
    endereco: string;
    telefone: string;
    email_contato: string;
  }>({
    name: '',
    role: 'client_user',
    active: true,
    cpf_cnpj: '',
    razao_social: '',
    endereco: '',
    telefone: '',
    email_contato: ''
  });

  const isEditing = !!userId;

  useEffect(() => {
    if (isEditing && userId) {
      loadUserData();
    } else {
      setLoadingData(false);
    }
  }, [isEditing, userId]);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserData({
          name: data.name || '',
          role: data.role || 'client_user',
          active: data.active ?? true,
          cpf_cnpj: data.cpf_cnpj || '',
          razao_social: data.razao_social || '',
          endereco: data.endereco || '',
          telefone: data.telefone || '',
          email_contato: data.email_contato || ''
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do usuário',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) {
      toast({
        title: 'Erro',
        description: 'Dados da empresa não encontrados',
        variant: 'destructive'
      });
      return;
    }

    if (!userData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const profileData = {
        name: userData.name.trim(),
        role: userData.role,
        active: userData.active,
        cpf_cnpj: userData.cpf_cnpj.trim() || null,
        razao_social: userData.razao_social.trim() || null,
        endereco: userData.endereco.trim() || null,
        telefone: userData.telefone.trim() || null,
        email_contato: userData.email_contato.trim() || null,
        company_id: company.id
      };

      if (isEditing && userId) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso!'
        });
      } else {
        // For creating new users, we would need additional logic
        // This is a simplified version
        toast({
          title: 'Info',
          description: 'Criação de novos usuários deve ser feita através do sistema de convites'
        });
      }

      navigate('/user-management');
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar usuário',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/user-management')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{isEditing ? 'Editar Usuário' : 'Criar Novo Usuário'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  placeholder="Digite o nome do usuário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select value={userData.role} onValueChange={(value: 'system_owner' | 'company_admin' | 'technician' | 'client_user') => 
                  setUserData({ ...userData, role: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_user">Cliente</SelectItem>
                    <SelectItem value="technician">Técnico</SelectItem>
                    <SelectItem value="company_admin">Admin da Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={userData.cpf_cnpj}
                  onChange={(e) => setUserData({ ...userData, cpf_cnpj: e.target.value })}
                  placeholder="Digite o CPF ou CNPJ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={userData.telefone}
                  onChange={(e) => setUserData({ ...userData, telefone: e.target.value })}
                  placeholder="Digite o telefone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contato">Email de Contato</Label>
                <Input
                  id="email_contato"
                  type="email"
                  value={userData.email_contato}
                  onChange={(e) => setUserData({ ...userData, email_contato: e.target.value })}
                  placeholder="Digite o email de contato"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  value={userData.razao_social}
                  onChange={(e) => setUserData({ ...userData, razao_social: e.target.value })}
                  placeholder="Digite a razão social"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={userData.endereco}
                onChange={(e) => setUserData({ ...userData, endereco: e.target.value })}
                placeholder="Digite o endereço completo"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={userData.active}
                onCheckedChange={(checked) => 
                  setUserData({ ...userData, active: checked as boolean })
                }
              />
              <Label htmlFor="active">Usuário ativo</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/user-management')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar' : 'Criar'} Usuário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}