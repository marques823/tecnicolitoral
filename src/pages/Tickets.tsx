import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Edit,
  History,
  FileText,
  Share2,
  MoreVertical,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportTicketToPDF } from '@/utils/pdfExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority | null;
  status: TicketStatus | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  company_id: string;
  category_id: string;
  created_by: string;
  assigned_to: string | null;
  client_id: string | null;
  categories?: {
    name: string;
  } | null;
  clients?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    company_name: string | null;
    document: string | null;
  } | null;
}

function Tickets() {
  const navigate = useNavigate();
  const { user, profile, company, loading } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const canEditTickets = profile?.role === 'company_admin' || profile?.role === 'technician';

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate('/auth');
      return;
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile && company) {
      loadTickets();
    }
  }, [user, profile, company]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          categories(name),
          clients(id, name, email, phone, address, company_name, document)
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false });

      // Apply user-specific filters
      if (profile?.role === 'client_user') {
        query = query.or(`created_by.eq.${user!.id},client_id.in.(${await getUserClientIds()})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar chamados',
        variant: 'destructive'
      });
    } finally {
      setLoadingTickets(false);
    }
  };

  const getUserClientIds = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', company!.id);
    
    return data?.map(c => c.id).join(',') || '';
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term) ||
        ticket.categories?.name.toLowerCase().includes(term) ||
        ticket.clients?.name.toLowerCase().includes(term)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Status do chamado atualizado com sucesso!'
      });

      loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do chamado',
        variant: 'destructive'
      });
    }
  };

  const getPriorityIcon = (priority: TicketPriority | null) => {
    switch (priority) {
      case 'urgent' as any:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: TicketStatus | null) => {
    switch (status) {
      case 'open':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading || loadingTickets) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chamados</h1>
        <Button onClick={() => navigate('/tickets/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar chamados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum chamado encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(ticket.priority)}
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      <Badge variant={
                        ticket.status === 'open' ? 'destructive' :
                        ticket.status === 'in_progress' ? 'default' :
                        ticket.status === 'resolved' ? 'secondary' : 'outline'
                      }>
                        {ticket.status === 'open' ? 'Aberto' :
                         ticket.status === 'in_progress' ? 'Em Andamento' :
                         ticket.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>#{ticket.id.slice(0, 8)}</span>
                      <span>{format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}</span>
                      {ticket.categories && (
                        <span>Categoria: {ticket.categories.name}</span>
                      )}
                      {ticket.clients && (
                        <span>Cliente: {ticket.clients.name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {canEditTickets && (
                      <Select 
                        value={ticket.status || 'open'} 
                        onValueChange={(value: TicketStatus) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-40" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEditTickets && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/tickets/edit/${ticket.id}`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => exportTicketToPDF(ticket)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/technical-notes/create?ticket_id=${ticket.id}`)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Notas Técnicas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/tickets/share/${ticket.id}`)}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartilhar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default Tickets;