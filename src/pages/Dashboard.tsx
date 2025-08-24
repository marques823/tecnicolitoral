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

    if (profile?.role === 'client') {
      // Cliente só vê seus próprios tickets
      ticketsQuery = ticketsQuery.eq('created_by', user?.id);
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
    if (profile?.role !== 'master') return;

    const [{ data: activeUsers }, { data: plans }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id')
        .eq('company_id', profile.company_id)
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

    if (profile?.role === 'client') {
      ticketQuery = ticketQuery.eq('created_by', user?.id);
    } else if (profile?.role === 'technician') {
      ticketQuery = ticketQuery.or(`assigned_to.eq.${user?.id},assigned_to.is.null`);
    }

    const { data: tickets } = await ticketQuery;

    if (!tickets || tickets.length === 0) {
      setRecentTickets([]);
      return;
    }

    // Buscar nomes dos usuários que criaram os tickets
    const userIds = [...new Set(tickets.map(t => t.created_by))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name')
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
      master: 'default',
      technician: 'secondary',
      client: 'outline'
    } as const;
    
    const labels = {
      master: 'Master',
      technician: 'Técnico',
      client: 'Cliente'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!company ? (
          // No company assigned
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Aguardando atribuição</h2>
            <p className="text-muted-foreground mb-6">
              Você ainda não foi atribuído a uma empresa. Entre em contato com o administrador.
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              Fazer logout
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <Card className="p-3 sm:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                    {profile.role === 'client' ? 'Meus Chamados' : 'Total'}
                  </CardTitle>
                  <Ticket className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {loadingData ? '...' : stats.totalTickets}
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {profile.role === 'client' ? 'Total criados' : 'Todos os tickets'}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Abertos
                  </CardTitle>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-destructive rounded-full"></div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {loadingData ? '...' : stats.openTickets}
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Aguardando atendimento
                  </p>
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Progresso
                  </CardTitle>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-warning rounded-full"></div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {loadingData ? '...' : stats.inProgressTickets}
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Sendo processados
                  </p>
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    {profile.role === 'master' ? 'Usuários' : 'Concluídos'}
                  </CardTitle>
                  {profile.role === 'master' ? 
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /> :
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full"></div>
                  }
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    {loadingData ? '...' : 
                      profile.role === 'master' ? stats.activeUsers : stats.resolvedToday
                    }
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {profile.role === 'master' 
                      ? `de ${stats.maxUsers} disponíveis`
                      : 'Finalizados hoje'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Acesse as funcionalidades principais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Button 
                    className="w-full justify-start h-10 sm:h-auto" 
                    variant="default"
                    onClick={() => navigate('/tickets?action=new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Chamado
                  </Button>
                  <Button 
                    className="w-full justify-start h-10 sm:h-auto" 
                    variant="outline"
                    onClick={() => navigate('/tickets')}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Gerenciar Chamados
                  </Button>
                  {(profile.role === 'master' || profile.role === 'technician') && (
                    <Button 
                      className="w-full justify-start h-10 sm:h-auto" 
                      variant="outline"
                      onClick={() => navigate('/reports')}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Relatórios
                    </Button>
                  )}
                  {profile.role === 'master' && (
                    <>
                      <Button 
                        className="w-full justify-start h-10 sm:h-auto" 
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
                        Gerenciar Categorias
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
                  {profile.role === 'super_admin' && (
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

              <Card>
                <CardHeader>
                  <CardTitle>
                    {profile.role === 'client' ? 'Meus Últimos Chamados' : 'Últimos Chamados'}
                  </CardTitle>
                  <CardDescription>
                    {profile.role === 'client' 
                      ? 'Seus chamados mais recentes'
                      : 'Acompanhe os chamados mais recentes'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentTickets.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      Nenhum chamado encontrado
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentTickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{ticket.title}</p>
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