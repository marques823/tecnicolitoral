import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Users, Clock, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportReportToPDF } from '@/utils/pdfExport';

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

export default function Reports() {
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
  const [period, setPeriod] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const handleExportPDF = () => {
    const reportData = {
      period: period === '7' ? 'Últimos 7 dias' : 
              period === '30' ? 'Últimos 30 dias' : 
              period === '90' ? 'Últimos 90 dias' : 'Último ano',
      totalTickets: ticketStats.total,
      openTickets: ticketStats.open,
      inProgressTickets: ticketStats.in_progress,
      resolvedTickets: ticketStats.resolved,
      closedTickets: ticketStats.closed,
    };

    const additionalData = {
      categoryStats,
      priorityStats,
      monthlyStats,
      userStats
    };

    exportReportToPDF(reportData, additionalData);
  };

  const canViewReports = profile?.role === 'master' || profile?.role === 'technician';

  useEffect(() => {
    if (canViewReports) {
      loadReports();
    }
  }, [period, canViewReports]);

  const loadReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTicketStats(),
        loadCategoryStats(),
        loadPriorityStats(),
        loadMonthlyStats(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketStats = async () => {
    const dateFilter = period !== 'all' 
      ? `created_at >= now() - interval '${period} days'`
      : 'true';

    const { data, error } = await supabase
      .from('tickets')
      .select('status')
      .filter('created_at', 'gte', period !== 'all' ? new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString() : '1900-01-01');

    if (error) throw error;

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
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        category_id,
        categories (name)
      `)
      .filter('created_at', 'gte', period !== 'all' ? new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString() : '1900-01-01');

    if (error) throw error;

    const categoryMap = new Map();
    data?.forEach(ticket => {
      const category = ticket.categories as any;
      const categoryName = category?.name || 'Sem categoria';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    });

    const stats = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count
    }));

    setCategoryStats(stats);
  };

  const loadPriorityStats = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('priority')
      .filter('created_at', 'gte', period !== 'all' ? new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString() : '1900-01-01');

    if (error) throw error;

    const priorityMap = new Map();
    data?.forEach(ticket => {
      const priority = ticket.priority || 'medium';
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });

    const stats = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count
    }));

    setPriorityStats(stats);
  };

  const loadMonthlyStats = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('created_at')
      .filter('created_at', 'gte', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at');

    if (error) throw error;

    const monthMap = new Map();
    data?.forEach(ticket => {
      const date = new Date(ticket.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    const stats = Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      count
    }));

    setMonthlyStats(stats);
  };

  const loadUserStats = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        assigned_to,
        status,
        profiles!tickets_assigned_to_fkey (name)
      `)
      .filter('created_at', 'gte', period !== 'all' ? new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString() : '1900-01-01')
      .not('assigned_to', 'is', null);

    if (error) throw error;

    const userMap = new Map();
    data?.forEach(ticket => {
      const profile = ticket.profiles as any;
      const userName = profile?.name || 'Usuário desconhecido';
      if (!userMap.has(userName)) {
        userMap.set(userName, { assigned_count: 0, resolved_count: 0 });
      }
      const stats = userMap.get(userName);
      stats.assigned_count++;
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        stats.resolved_count++;
      }
    });

    const stats = Array.from(userMap.entries()).map(([user_name, counts]) => ({
      user_name,
      ...counts
    }));

    setUserStats(stats);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-500',
      in_progress: 'bg-yellow-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  if (!canViewReports) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar os relatórios.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada dos chamados e desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico por Categoria */}
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
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="priority"
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

      {/* Gráfico Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal de Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Performance dos Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          {userStats.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum dado de performance encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Tickets Atribuídos</TableHead>
                  <TableHead>Tickets Resolvidos</TableHead>
                  <TableHead>Taxa de Resolução</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.map((user) => (
                  <TableRow key={user.user_name}>
                    <TableCell className="font-medium">{user.user_name}</TableCell>
                    <TableCell>{user.assigned_count}</TableCell>
                    <TableCell>{user.resolved_count}</TableCell>
                    <TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}