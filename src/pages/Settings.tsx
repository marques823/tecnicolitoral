import { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Upload,
  Image,
  Palette,
  Eye,
  Trash2
} from 'lucide-react';

interface CompanySettings {
  name: string;
  active: boolean;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  custom_css: string;
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
    active: true,
    logo_url: '',
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    custom_css: ''
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile, company, user, signOut } = useAuth();

  const canManageCompany = profile?.role === 'master' || profile?.role === 'super_admin';

  useEffect(() => {
    loadSettings();
  }, [company, profile]);

  const loadSettings = async () => {
    console.log('🔄 Carregando configurações...', { company, profile, user });
    setLoading(true);
    try {
      // Carregar configurações da empresa diretamente do banco
      if (company?.id) {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', company.id)
          .single();

        if (error) {
          console.error('Erro ao carregar empresa:', error);
        } else if (companyData) {
          setCompanySettings({
            name: companyData.name || '',
            active: companyData.active ?? true,
            logo_url: companyData.logo_url || '',
            primary_color: companyData.primary_color || '#2563eb',
            secondary_color: companyData.secondary_color || '#64748b',
            custom_css: companyData.custom_css || ''
          });
        }
      }

      // Carregar configurações do perfil
      if (profile) {
        setProfileSettings({
          name: profile.name || ''
        });
      }

      // Carregar configurações de notificação do banco
      if (user?.id) {
        const { data: notificationData, error: notificationError } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (notificationError && notificationError.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações de notificação:', notificationError);
        } else if (notificationData) {
          setNotificationSettings({
            email_on_new_ticket: notificationData.email_on_new_ticket,
            email_on_status_change: notificationData.email_on_status_change,
            email_on_assignment: notificationData.email_on_assignment
          });
        } else {
          // Se não existe configuração, manter valores padrão
          setNotificationSettings({
            email_on_new_ticket: false,
            email_on_status_change: false,
            email_on_assignment: false
          });
        }
      }
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

  const uploadLogo = async (file: File) => {
    if (!company?.id || !canManageCompany) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}/logo.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL público
      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const logoUrl = data.publicUrl;

      // Atualizar configurações locais
      setCompanySettings(prev => ({ ...prev, logo_url: logoUrl }));

      toast({
        title: "Sucesso",
        description: "Logotipo enviado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload do logotipo:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do logotipo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Erro",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadLogo(file);
    }
  };

  const saveCompanySettings = async () => {
    console.log('💾 Tentando salvar configurações da empresa...', { 
      companyId: company?.id, 
      canManage: canManageCompany, 
      settings: companySettings 
    });
    
    if (!company?.id || !canManageCompany) {
      console.log('❌ Não é possível salvar - sem permissão ou empresa');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companySettings.name,
          active: companySettings.active,
          logo_url: companySettings.logo_url,
          primary_color: companySettings.primary_color,
          secondary_color: companySettings.secondary_color,
          custom_css: companySettings.custom_css
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações da empresa salvas com sucesso",
      });

      // Recarregar a página para aplicar as novas configurações de tema
      window.location.reload();
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

  const saveNotificationSettings = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          email_on_new_ticket: notificationSettings.email_on_new_ticket,
          email_on_status_change: notificationSettings.email_on_status_change,
          email_on_assignment: notificationSettings.email_on_assignment
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações de notificação salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de notificação",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user?.id) return;

    const confirmDelete = window.confirm(
      'Tem certeza que deseja deletar sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.'
    );

    if (!confirmDelete) return;

    const secondConfirm = window.prompt(
      "Para confirmar, digite 'DELETE' (em maiúsculas):"
    );

    if (secondConfirm !== "DELETE") {
      toast({
        title: "Cancelado",
        description: "Deleção da conta cancelada",
      });
      return;
    }

    setDeleting(true);
    try {
      // Deletar o perfil primeiro
      if (profile?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (profileError) {
          console.error('Erro ao deletar perfil:', profileError);
        }
      }

      // Deletar o usuário através da edge function manage-user
      const { error: userError } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'delete_user',
          user_id: user.id
        }
      });

      if (userError) throw userError;

      toast({
        title: "Conta deletada",
        description: "Sua conta foi deletada com sucesso",
      });

      // Fazer logout e redirecionar
      await signOut();
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            {/* Seção de Logotipo */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <Label className="text-base font-semibold">Logotipo da Empresa</Label>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {companySettings.logo_url && (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    <img 
                      src={companySettings.logo_url} 
                      alt="Logo da empresa" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                
                <div className="flex-1 space-y-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Enviando...' : 'Selecionar Logotipo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou GIF (máx. 5MB)
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Seção de Personalização */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <Label className="text-base font-semibold">Personalização</Label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={companySettings.primary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 p-1 rounded"
                    />
                    <Input
                      value={companySettings.primary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={companySettings.secondary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-10 p-1 rounded"
                    />
                    <Input
                      value={companySettings.secondary_color}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-css">CSS Personalizado</Label>
                <Textarea
                  id="custom-css"
                  value={companySettings.custom_css}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, custom_css: e.target.value }))}
                  placeholder="/* CSS personalizado para sua empresa */
:root {
  --primary: 220 75% 55%;
  --secondary: 215 20% 55%;
}"
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  CSS personalizado será aplicado globalmente no sistema
                </p>
              </div>
              
              {/* Preview das cores */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Preview:</span>
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: companySettings.primary_color }}
                />
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: companySettings.secondary_color }}
                />
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

            <Button onClick={saveCompanySettings} disabled={saving} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações da Empresa'}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <Button onClick={saveNotificationSettings} disabled={saving} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Preferências de Notificação'}
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

          <Separator />

          {/* Zona de Perigo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-destructive">Zona de Perigo</h3>
            </div>

            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-destructive">Deletar Conta</h4>
                  <p className="text-sm text-muted-foreground">
                    Esta ação é irreversível. Todos os seus dados, incluindo perfil, configurações e histórico serão permanentemente deletados. Você precisará digitar "DELETE" para confirmar.
                  </p>
                </div>

                <Button 
                  variant="destructive" 
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deletando...' : 'Deletar Minha Conta'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}