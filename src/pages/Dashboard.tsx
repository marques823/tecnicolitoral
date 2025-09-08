import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Ticket, 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  Plus,
  LogOut,
  User,
  Calendar,
  TrendingUp,
  Clock,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { exportReportToPDF } from '@/utils/pdfExport';

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

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface CategoryStats {
  name: string;
  count: number;
}

interface PriorityStats {
  priority: string;
  count: number;
}

interface MonthlyStats {
  month: string;
  count: number;
}

interface UserStats {
  user_name: string;
  assigned_count: number;
  resolved_count: number;
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

  // Reports data
  const [period, setPeriod] = useState('30');
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [priorityStats, setPriorityStats] = useState<PriorityStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);

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

  useEffect(() => {
    if (user && profile && company && (profile.role === 'company_admin' || profile.role === 'technician')) {
      loadReports();
    }
  }, [period, user, profile, company]);

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

    // Filtrar usuários excluindo company_admin da contagem
    const nonAdminUsers = activeUsers?.filter(user => user.role !== 'company_admin') || [];

    setStats(prev => ({
      ...prev,
      activeUsers: nonAdminUsers.length,
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

  // Reports functions
  const loadReports = async () => {
    if (!profile?.company_id) return;
    
    try {
      await Promise.all([
        loadReportTicketStats(),
        loadCategoryStats(),
        loadPriorityStats(),
        loadMonthlyStats(),
        loadUserReportStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const loadReportTicketStats = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const { data } = await supabase
      .from('tickets')
      .select('status')
      .gte('created_at', startDate.toISOString());

    const stats = {
      total: data?.length || 0,
      open: data?.filter(t => t.status === 'open').length || 0,
      in_progress: data?.filter(t => t.status === 'in_progress').length || 0,
      resolved: data?.filter(t => t.status === 'resolved').length || 0,
      closed: data?.filter(t => t.status === 'closed').length || 0
    };

    setTicketStats(stats);
  };

  const loadCategoryStats = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const { data } = await supabase
      .from('tickets')
      .select('category_id, categories(name)')
      .gte('created_at', startDate.toISOString());

    const categoryMap = new Map();
    data?.forEach(ticket => {
      const categoryName = (ticket.categories as any)?.name || 'Sem categoria';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    });

    const stats = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count: count as number
    }));

    setCategoryStats(stats);
  };

  const loadPriorityStats = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const { data } = await supabase
      .from('tickets')
      .select('priority')
      .gte('created_at', startDate.toISOString());

    const priorityMap = new Map();
    data?.forEach(ticket => {
      const priority = ticket.priority || 'medium';
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });

    const stats = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count: count as number
    }));

    setPriorityStats(stats);
  };

  const loadMonthlyStats = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    const monthlyMap = new Map();
    data?.forEach(ticket => {
      const date = new Date(ticket.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    const stats = Array.from(monthlyMap.entries()).map(([month, count]) => ({
      month,
      count: count as number
    }));

    setMonthlyStats(stats);
  };

  const loadUserReportStats = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const { data } = await supabase
      .from('tickets')
      .select('assigned_to, status')
      .gte('created_at', startDate.toISOString())
      .not('assigned_to', 'is', null);

    if (!data || data.length === 0) {
      setUserStats([]);
      return;
    }

    const userIds = [...new Set(data.map(t => t.assigned_to))];
    const { data: profiles } = await supabase
      .rpc('get_basic_profiles', { target_company_id: profile?.company_id })
      .in('user_id', userIds);

    const userMap = new Map();
    data.forEach(ticket => {
      const userId = ticket.assigned_to;
      if (!userMap.has(userId)) {
        userMap.set(userId, { assigned: 0, resolved: 0 });
      }
      
      const userStat = userMap.get(userId);
      userStat.assigned++;
      if (ticket.status === 'resolved') {
        userStat.resolved++;
      }
    });

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    const stats = Array.from(userMap.entries()).map(([userId, stats]) => ({
      user_name: profileMap.get(userId) || 'Usuário desconhecido',
      assigned_count: stats.assigned,
      resolved_count: stats.resolved
    }));

    setUserStats(stats);
  };

  const handleExportPDF = async () => {
    const reportData = {
      period,
      totalTickets: ticketStats.total,
      openTickets: ticketStats.open,
      inProgressTickets: ticketStats.in_progress,
      resolvedTickets: ticketStats.resolved,
      closedTickets: ticketStats.closed,
      categoryStats,
      priorityStats,
      monthlyStats,
      userStats,
      companyName: company?.name || 'Empresa'
    };
    
    await exportReportToPDF(reportData);
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
      open: 'bg-destructive',
      in_progress: 'bg-primary',
      resolved: 'bg-success',
      closed: 'bg-muted'
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-success',
      medium: 'bg-warning',
      high: 'bg-destructive'
    };
    return colors[priority as keyof typeof colors] || 'bg-muted';
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

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
                       ? `de ${stats.maxUsers} disponíveis (excluindo admins)`
                       : 'Finalizados hoje'
                     }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Tickets */}
              <Card className="bg-gradient-card border-white/20 backdrop-blur-sm animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    Chamados Recentes
                  </CardTitle>
                  <CardDescription>
                    Últimos 5 chamados criados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum chamado encontrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentTickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/80 transition-colors cursor-pointer"
                          onClick={() => navigate(`/ticket-details/${ticket.id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground">
                              por {ticket.created_by_name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusVariant(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/tickets')}
                    >
                      Ver Todos os Chamados
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
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
            </div>

            {/* Reports Section - Only for admins and technicians */}
            {(profile.role === 'company_admin' || profile.role === 'technician') && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-primary" />
                      Relatórios
                    </h2>
                    <p className="text-muted-foreground">
                      Análise de performance e estatísticas detalhadas
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Report Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total</CardTitle>
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ticketStats.total}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Abertos</CardTitle>
                      <div className="w-4 h-4 bg-destructive rounded-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ticketStats.open}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                      <div className="w-4 h-4 bg-warning rounded-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ticketStats.in_progress}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
                      <div className="w-4 h-4 bg-success rounded-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ticketStats.resolved}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Fechados</CardTitle>
                      <div className="w-4 h-4 bg-muted rounded-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ticketStats.closed}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Category Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tickets por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Priority Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Prioridade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={priorityStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ priority, percent }) => `${priority}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {priorityStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Trend */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Tendência Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance dos Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead className="text-center">Atribuídos</TableHead>
                          <TableHead className="text-center">Resolvidos</TableHead>
                          <TableHead className="text-center">Taxa de Resolução</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userStats.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{user.user_name}</TableCell>
                            <TableCell className="text-center">{user.assigned_count}</TableCell>
                            <TableCell className="text-center">{user.resolved_count}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {user.assigned_count > 0 
                                  ? `${Math.round((user.resolved_count / user.assigned_count) * 100)}%`
                                  : '0%'
                                }
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {userStats.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível para o período selecionado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;