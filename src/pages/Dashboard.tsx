import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Plus,
  Eye,
  FileText,
  Settings,
  Building2,
  LogOut
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  activeUsers: number;
  maxUsers: number;
  weeklyGrowth: number;
}

interface RecentTicket {
  id: string;
  title: string;
  status: string;
  created_by_name: string;
  created_at: string;
  priority?: string;
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
    maxUsers: 0,
    weeklyGrowth: 0
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

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
        loadRecentTickets(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados da dashboard:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTicketStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Total de tickets baseado no role do usuário
    let ticketsQuery = supabase.from('tickets').select('status, resolved_at, created_at');
    let weeklyQuery = supabase.from('tickets').select('id').gte('created_at', weekAgo);

    if (profile?.role === 'client_user') {
      const userClientIds = await getUserClientIds();
      if (userClientIds) {
        const condition = `created_by.eq.${user?.id},client_id.in.(${userClientIds})`;
        ticketsQuery = ticketsQuery.or(condition);
        weeklyQuery = weeklyQuery.or(condition);
      } else {
        ticketsQuery = ticketsQuery.eq('created_by', user?.id);
        weeklyQuery = weeklyQuery.eq('created_by', user?.id);
      }
    } else if (profile?.role === 'technician') {
      const condition = `assigned_to.eq.${user?.id},assigned_to.is.null`;
      ticketsQuery = ticketsQuery.or(condition);
      weeklyQuery = weeklyQuery.or(condition);
    }

    const [{ data: tickets }, { data: weeklyTickets }] = await Promise.all([
      ticketsQuery,
      weeklyQuery
    ]);

    const totalTickets = tickets?.length || 0;
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedToday = tickets?.filter(t => 
      t.status === 'resolved' && 
      t.resolved_at && 
      t.resolved_at.startsWith(today)
    ).length || 0;

    // Calcular crescimento semanal
    const previousWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const previousWeekTickets = tickets?.filter(t => 
      new Date(t.created_at) >= previousWeekStart && 
      new Date(t.created_at) < new Date(weekAgo)
    ).length || 0;
    
    const weeklyGrowth = previousWeekTickets > 0 
      ? Math.round(((weeklyTickets?.length || 0) - previousWeekTickets) / previousWeekTickets * 100)
      : 0;

    setStats(prev => ({
      ...prev,
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedToday,
      weeklyGrowth
    }));
  };

  const loadUserStats = async () => {
    if (profile?.role !== 'company_admin') return;

    const [{ data: activeUsers }, { data: plans }] = await Promise.all([
      supabase
        .rpc('get_basic_profiles', { target_company_id: profile.company_id })
        .eq('active', true)
        .neq('role', 'company_admin'),
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

  const getUserClientIds = async () => {
    if (!user?.email) return '';
    
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', profile?.company_id)
      .eq('email', user.email);
    
    return data?.map(c => c.id).join(',') || '';
  };

  const loadRecentTickets = async () => {
    let ticketQuery = supabase
      .from('tickets')
      .select('id, title, status, created_at, created_by, priority')
      .order('created_at', { ascending: false })
      .limit(3);

    if (profile?.role === 'client_user') {
      const userClientIds = await getUserClientIds();
      if (userClientIds) {
        ticketQuery = ticketQuery.or(`created_by.eq.${user?.id},client_id.in.(${userClientIds})`);
      } else {
        ticketQuery = ticketQuery.eq('created_by', user?.id);
      }
    } else if (profile?.role === 'technician') {
      ticketQuery = ticketQuery.or(`assigned_to.eq.${user?.id},assigned_to.is.null`);
    }

    const { data: tickets } = await ticketQuery;

    if (!tickets || tickets.length === 0) {
      setRecentTickets([]);
      return;
    }

    const userIds = [...new Set(tickets.map(t => t.created_by))];
    const { data: profiles } = await supabase
      .rpc('get_basic_profiles', { target_company_id: profile.company_id })
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      created_by_name: profileMap.get(ticket.created_by) || 'Usuário desconhecido',
      created_at: ticket.created_at
    }));

    setRecentTickets(formattedTickets);
  };

  const loadChartData = async () => {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('status, priority, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!tickets) return;

    // Dados para gráfico de status
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: getStatusColor(status)
    }));

    setChartData(chartData);
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

  const getStatusColor = (status: string) => {
    const colors = {
      open: '#ef4444',
      in_progress: '#3b82f6', 
      resolved: '#10b981',
      closed: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
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

  if (!company) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <CardContent>
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhuma empresa atribuída</h2>
              <p className="text-muted-foreground mb-6">
                Você precisa estar vinculado a uma empresa para acessar o dashboard.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/settings')} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                <Button onClick={handleSignOut} variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {company?.name} • {profile?.role === 'company_admin' ? 'Admin' : profile?.role === 'technician' ? 'Técnico' : 'Cliente'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/settings')} variant="outline" size="sm">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Configurações</span>
              </Button>
              <Button onClick={handleSignOut} variant="destructive" size="sm">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTickets}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className={`h-3 w-3 mr-1 ${stats.weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}% esta semana
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.openTickets}</div>
                  <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.inProgressTickets}</div>
                  <p className="text-xs text-muted-foreground">Sendo processados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.resolvedToday}</div>
                  <p className="text-xs text-muted-foreground">Finalizados hoje</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Status */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Status</CardTitle>
                  <CardDescription>Últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Atividade Recente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atividade Recente</CardTitle>
                  <CardDescription>Últimos chamados criados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum chamado recente
                    </p>
                  ) : (
                    recentTickets.map((ticket) => (
                      <div key={ticket.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {ticket.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              por {ticket.created_by_name}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(ticket.status)} className="text-xs ml-2 shrink-0">
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(ticket.created_at)}
                        </p>
                        {ticket !== recentTickets[recentTickets.length - 1] && (
                          <div className="border-b border-border/10"></div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acesso Rápido</CardTitle>
                <CardDescription>Ações frequentes do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => navigate('/tickets/create')}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs text-center">Novo Chamado</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => navigate('/tickets')}
                  >
                    <Eye className="h-5 w-5" />
                    <span className="text-xs text-center">Ver Chamados</span>
                  </Button>

                  {profile?.role === 'company_admin' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex-col gap-2"
                        onClick={() => navigate('/user-management')}
                      >
                        <Users className="h-5 w-5" />
                        <span className="text-xs text-center">Usuários</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex-col gap-2"
                        onClick={() => navigate('/reports')}
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-xs text-center">Relatórios</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Stats for Admin */}
            {profile?.role === 'company_admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uso do Plano</CardTitle>
                  <CardDescription>
                    {stats.activeUsers} de {stats.maxUsers} usuários utilizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usuários ativos</span>
                      <span>{stats.activeUsers}/{stats.maxUsers}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((stats.activeUsers / stats.maxUsers) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    {stats.activeUsers >= stats.maxUsers * 0.8 && (
                      <p className="text-xs text-amber-600">
                        Você está próximo do limite do seu plano
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;