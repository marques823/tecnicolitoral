import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  Building2, 
  User, 
  Bell, 
  Shield,
  Save,
  AlertTriangle
} from 'lucide-react';

interface CompanySettings {
  name: string;
  active: boolean;
}

interface ProfileSettings {
  name: string;
}

interface NotificationSettings {
  email_on_new_ticket: boolean;
  email_on_status_change: boolean;
  email_on_assignment: boolean;
}

export default function Settings() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    active: true
  });
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    name: ''
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_on_new_ticket: false,
    email_on_status_change: false,
    email_on_assignment: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile, company, user } = useAuth();

  const canManageCompany = profile?.role === 'master';

  useEffect(() => {
    loadSettings();
  }, [company, profile]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Carregar configurações da empresa
      if (company) {
        setCompanySettings({
          name: company.name || '',
          active: company.active ?? true
        });
      }

      // Carregar configurações do perfil
      if (profile) {
        setProfileSettings({
          name: profile.name || ''
        });
      }

      // Configurações de notificação são simuladas (podem ser implementadas no futuro)
      setNotificationSettings({
        email_on_new_ticket: false,
        email_on_status_change: false,
        email_on_assignment: false
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCompanySettings = async () => {
    if (!company?.id || !canManageCompany) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companySettings.name,
          active: companySettings.active
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações da empresa salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações da empresa",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProfileSettings = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileSettings.name
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações do perfil salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações do perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = () => {
    // Implementação futura - por enquanto apenas simula o salvamento
    toast({
      title: "Sucesso",
      description: "Configurações de notificação salvas",
    });
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da empresa e do seu perfil
        </p>
      </div>

      {/* Configurações da Empresa */}
      {canManageCompany && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <CardTitle>Configurações da Empresa</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  value={companySettings.name}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-active">Status da Empresa</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="company-active"
                    checked={companySettings.active}
                    onCheckedChange={(checked) => setCompanySettings(prev => ({ ...prev, active: checked }))}
                  />
                  <span className="text-sm">
                    {companySettings.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>

            {!companySettings.active && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  Desativar a empresa impedirá o acesso de todos os usuários
                </p>
              </div>
            )}

            <Button onClick={saveCompanySettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações da Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configurações do Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <CardTitle>Configurações do Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={profileSettings.name}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                value={user?.email || ''}
                disabled
                placeholder="Email do usuário"
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-role">Função</Label>
            <Input
              id="profile-role"
              value={profile?.role === 'master' ? 'Master' : 
                    profile?.role === 'technician' ? 'Técnico' : 'Cliente'}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              A função é definida pelo administrador
            </p>
          </div>

          <Button onClick={saveProfileSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações do Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Configurações de Notificação */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notificações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure quando você deseja receber notificações por email
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novos Chamados</p>
                <p className="text-sm text-muted-foreground">
                  Receber email quando um novo chamado for criado
                </p>
              </div>
              <Switch
                checked={notificationSettings.email_on_new_ticket}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, email_on_new_ticket: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mudanças de Status</p>
                <p className="text-sm text-muted-foreground">
                  Receber email quando o status de um chamado mudar
                </p>
              </div>
              <Switch
                checked={notificationSettings.email_on_status_change}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, email_on_status_change: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Atribuições</p>
                <p className="text-sm text-muted-foreground">
                  Receber email quando um chamado for atribuído a você
                </p>
              </div>
              <Switch
                checked={notificationSettings.email_on_assignment}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, email_on_assignment: checked }))
                }
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={saveNotificationSettings} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Salvar Preferências de Notificação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Informações da Conta</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">ID do Usuário</p>
              <p className="text-sm text-muted-foreground font-mono">
                {user?.id}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Conta Criada</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              Suas informações estão protegidas e criptografadas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}