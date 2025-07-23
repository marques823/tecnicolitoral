import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Building, 
  Users, 
  Ticket, 
  Crown, 
  Star, 
  Edit,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  active: boolean;
  plan_id: string;
  created_at: string;
  plans?: {
    name: string;
    type: string;
    monthly_price: number;
  };
}

interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  role: 'master' | 'technician' | 'client' | 'super_admin';
  active: boolean;
  companies?: {
    name: string;
  };
}

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalTickets: number;
}

export default function SuperAdmin() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    totalTickets: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCompanies(),
        loadProfiles(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        plans (name, type, monthly_price)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setCompanies(data || []);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        companies (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setProfiles(data || []);
  };

  const loadStats = async () => {
    try {
      // Total e empresas ativas
      const { data: companiesData } = await supabase
        .from('companies')
        .select('active');
      
      // Total de usuários
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id');
      
      // Total de tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id');

      setStats({
        totalCompanies: companiesData?.length || 0,
        activeCompanies: companiesData?.filter(c => c.active).length || 0,
        totalUsers: profilesData?.length || 0,
        totalTickets: ticketsData?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const updateCompany = async (company: Company, data: Partial<Company>) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });

      loadCompanies();
      setEditingCompany(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (profile: Profile, data: { name?: string; role?: Profile['role']; active?: boolean }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      loadProfiles();
      setEditingProfile(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'basic':
        return <Building className="w-4 h-4" />;
      case 'premium':
        return <Star className="w-4 h-4" />;
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Apenas super administradores podem acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Carregando painel de administração...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Super Admin</h1>
            <p className="text-muted-foreground">
              Painel de administração do sistema TicketFlow
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empresas</p>
                  <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                  <p className="text-xs text-green-600">
                    {stats.activeCompanies} ativas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ticket className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tickets</p>
                  <p className="text-2xl font-bold">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa Ativação</p>
                  <p className="text-2xl font-bold">
                    {Math.round((stats.activeCompanies / stats.totalCompanies) * 100) || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Empresas ({companies.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Plano</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Criada em</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b">
                      <td className="py-2 font-medium">{company.name}</td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          {getPlanIcon(company.plans?.type || 'basic')}
                          <span>{company.plans?.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({formatPrice(company.plans?.monthly_price || 0)}/mês)
                          </span>
                        </div>
                      </td>
                      <td className="py-2">
                        <Badge variant={company.active ? "default" : "secondary"}>
                          {company.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                      <td className="py-2 text-sm text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCompany(company)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Empresa</DialogTitle>
                            </DialogHeader>
                            <CompanyEditForm
                              company={company}
                              onSave={(data) => updateCompany(company, data)}
                              onCancel={() => setEditingCompany(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Usuários ({profiles.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Empresa</th>
                    <th className="text-left py-2">Papel</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.slice(0, 20).map((profile) => (
                    <tr key={profile.id} className="border-b">
                      <td className="py-2 font-medium">{profile.name}</td>
                      <td className="py-2">{profile.companies?.name}</td>
                      <td className="py-2">
                        <Badge variant="outline">
                          {profile.role === 'master' ? 'Master' :
                           profile.role === 'technician' ? 'Técnico' :
                           profile.role === 'client' ? 'Cliente' :
                           profile.role === 'super_admin' ? 'Super Admin' : profile.role}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant={profile.active ? "default" : "secondary"}>
                          {profile.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProfile(profile)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Usuário</DialogTitle>
                            </DialogHeader>
                            <ProfileEditForm
                              profile={profile}
                              onSave={(data) => updateProfile(profile, data)}
                              onCancel={() => setEditingProfile(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profiles.length > 20 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Mostrando primeiros 20 usuários de {profiles.length} total.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CompanyEditForm({ 
  company, 
  onSave, 
  onCancel 
}: { 
  company: Company; 
  onSave: (data: Partial<Company>) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(company.name);
  const [active, setActive] = useState(company.active);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="company-name">Nome da Empresa</Label>
        <Input
          id="company-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="company-status">Status</Label>
        <Select value={active ? "true" : "false"} onValueChange={(value) => setActive(value === "true")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ativa</SelectItem>
            <SelectItem value="false">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave({ name, active })}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

function ProfileEditForm({ 
  profile, 
  onSave, 
  onCancel 
}: { 
  profile: Profile; 
  onSave: (data: { name?: string; role?: Profile['role']; active?: boolean }) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState<Profile['role']>(profile.role);
  const [active, setActive] = useState(profile.active);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="profile-name">Nome</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="profile-role">Papel</Label>
        <Select value={role} onValueChange={(value) => setRole(value as Profile['role'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="technician">Técnico</SelectItem>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="profile-status">Status</Label>
        <Select value={active ? "true" : "false"} onValueChange={(value) => setActive(value === "true")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ativo</SelectItem>
            <SelectItem value="false">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave({ name, role, active })}>
          Salvar
        </Button>
      </div>
    </div>
  );
}