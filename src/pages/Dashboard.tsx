import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  Plus,
  LogOut,
  User,
  Tags,
  Crown,
  Sliders,
  FileText,
  Shield
} from 'lucide-react';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  activeUsers: number;
  maxUsers: number;
}

interface RecentTicket {
  id: string;
  title: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile, company, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedToday: 0,
    activeUsers: 0,
    maxUsers: 0
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && profile && company) {
      loadDashboardData();
    }
  }, [user, profile, company]);

  const loadDashboardData = async () => {
    if (!profile?.company_id) return;
    
    setLoadingData(true);
    try {
      await Promise.all([
        loadTicketStats(),
        loadUserStats(),
        loadRecentTickets()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados da dashboard:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTicketStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Total de tickets baseado no role do usuário
    let ticketsQuery = supabase.from('tickets').select('status, resolved_at');

    if (profile?.role === 'client_user') {
      // Cliente vê tickets que criou e tickets atribuídos a ele
      ticketsQuery = ticketsQuery.or(`created_by.eq.${user?.id},assigned_to.eq.${user?.id}`);
    } else if (profile?.role === 'technician') {
      // Técnico vê tickets atribuídos a ele e tickets não atribuídos
      ticketsQuery = ticketsQuery.or(`assigned_to.eq.${user?.id},assigned_to.is.null`);
    }
    // Master vê todos os tickets da empresa (já filtrado por RLS)

    const { data: tickets } = await ticketsQuery;

    const totalTickets = tickets?.length || 0;
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
    
    // Tickets resolvidos hoje
    const resolvedToday = tickets?.filter(t => 
      t.status === 'resolved' && 
      t.resolved_at && 
      t.resolved_at.startsWith(today)
    ).length || 0;

    setStats(prev => ({
      ...prev,
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedToday
    }));
  };

  const loadUserStats = async () => {
    if (profile?.role !== 'company_admin') return;

    const [{ data: activeUsers }, { data: plans }] = await Promise.all([
      supabase
        .rpc('get_basic_profiles', { target_company_id: profile.company_id })
        .eq('active', true),
      supabase
        .from('companies')
        .select('plans(max_users)')
        .eq('id', profile.company_id)
        .single()
    ]);

    setStats(prev => ({
      ...prev,
      activeUsers: activeUsers?.length || 0,
      maxUsers: (plans as any)?.plans?.max_users || 0
    }));
  };

  const loadRecentTickets = async () => {
    // Primeiro buscar os tickets
    let ticketQuery = supabase
      .from('tickets')
      .select('id, title, status, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profile?.role === 'client_user') {
      ticketQuery = ticketQuery.or(`created_by.eq.${user?.id},assigned_to.eq.${user?.id}`);
    } else if (profile?.role === 'technician') {
      ticketQuery = ticketQuery.or(`assigned_to.eq.${user?.id},assigned_to.is.null`);
    }

    const { data: tickets } = await ticketQuery;

    if (!tickets || tickets.length === 0) {
      setRecentTickets([]);
      return;
    }

    // Buscar nomes dos usuários que criaram os tickets (usando função segura)
    const userIds = [...new Set(tickets.map(t => t.created_by))];
    const { data: profiles } = await supabase
      .rpc('get_basic_profiles', { target_company_id: profile.company_id })
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      created_by_name: profileMap.get(ticket.created_by) || 'Usuário desconhecido',
      created_at: ticket.created_at
    }));

    setRecentTickets(formattedTickets);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      open: 'Aberto',
      in_progress: 'Em andamento',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline'
    } as const;
    return variants[status as keyof typeof variants] || 'outline';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      company_admin: 'default',
      technician: 'secondary',
      client_user: 'outline'
    } as const;
    
    const labels = {
      company_admin: 'Admin da Empresa',
      technician: 'Técnico',
      client_user: 'Cliente'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold animate-fade-in">
                Bem-vindo, {profile?.name}!
              </h1>
              <p className="text-white/90 mt-2">
                {company?.name} • {getRoleBadge(profile?.role || '')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate('/tickets?action=new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Chamado
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!company ? (
          // No company assigned
          <div className="text-center py-16 animate-fade-in">
            <div className="bg-gradient-card p-8 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm max-w-md mx-auto">
              <Building2 className="w-16 h-16 mx-auto text-primary mb-6 animate-float" />
              <h2 className="text-2xl font-bold mb-4">Aguardando atribuição</h2>
              <p className="text-muted-foreground mb-8">
                Você ainda não foi atribuído a uma empresa. Entre em contato com o administrador.
              </p>
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Fazer logout
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-scale-in">
              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {profile.role === 'client_user' ? 'Meus Chamados' : 'Total'}
                  </CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {loadingData ? '...' : stats.totalTickets}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.role === 'client_user' ? 'Total criados' : 'Todos os tickets'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Abertos
                  </CardTitle>
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <div className="w-4 h-4 bg-destructive rounded-full"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {loadingData ? '...' : stats.openTickets}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando atendimento
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Em Progresso
                  </CardTitle>
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <div className="w-4 h-4 bg-warning rounded-full"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {loadingData ? '...' : stats.inProgressTickets}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sendo processados
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {profile.role === 'company_admin' ? 'Usuários' : 'Concluídos'}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${profile.role === 'company_admin' ? 'bg-primary/10' : 'bg-success/10'}`}>
                    {profile.role === 'company_admin' ? 
                      <Users className="h-4 w-4 text-primary" /> :
                      <div className="w-4 h-4 bg-success rounded-full"></div>
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profile.role === 'company_admin' ? 'text-primary' : 'text-success'}`}>
                    {loadingData ? '...' : 
                      profile.role === 'company_admin' ? stats.activeUsers : stats.resolvedToday
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                     {profile.role === 'company_admin' 
                       ? `de ${stats.maxUsers} disponíveis`
                       : 'Finalizados hoje'
                     }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription>
                    Acesse as funcionalidades principais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start bg-primary hover:bg-primary-glow transition-colors" 
                    onClick={() => navigate('/tickets?action=new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Chamado
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate('/tickets')}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Gerenciar Chamados
                  </Button>
                  {(profile.role === 'company_admin' || profile.role === 'technician') && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/reports')}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Relatórios
                    </Button>
                  )}
                  {profile.role === 'company_admin' && (
                    <>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate('/users')}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Usuários
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate('/categories')}
                      >
                        <Tags className="mr-2 h-4 w-4" />
                        Categorias
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate('/plans')}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Planos
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate('/custom-fields')}
                      >
                        <Sliders className="mr-2 h-4 w-4" />
                        Campos Personalizados
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => navigate('/technical-notes')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Notas Técnicas
                      </Button>
                    </>
                  )}
                  {profile.role === 'system_owner' && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/super-admin')}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Super Admin
                    </Button>
                  )}
                  <Button
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    {profile.role === 'client_user' ? 'Meus Últimos Chamados' : 'Últimos Chamados'}
                  </CardTitle>
                  <CardDescription>
                     {profile.role === 'client_user' 
                       ? 'Seus chamados mais recentes'
                       : 'Acompanhe os chamados mais recentes'
                     }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-background/50 rounded-lg animate-pulse">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-muted rounded-full w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        Nenhum chamado encontrado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-all duration-200 cursor-pointer border border-white/10"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground truncate">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Criado por {ticket.created_by_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;