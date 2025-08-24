import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  History,
  Share2,
  MoreVertical,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TicketFormSimple from '@/components/TicketFormSimple';
import TicketHistory from '@/components/TicketHistory';
import TicketShare from '@/components/TicketShare';
import TechnicalNotesForTicket from '@/components/TechnicalNotesForTicket';
import { exportTicketToPDF } from '@/utils/pdfExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority | null;
  status: TicketStatus | null;
  created_at: string;
  created_by: string;
  assigned_to?: string | null;
  category_id: string;
  resolved_at?: string | null;
  company_id: string;
  updated_at: string;
  client_id?: string | null;
  categories?: {
    name: string;
  } | null;
  clients?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    company_name?: string | null;
    document?: string | null;
  } | null;
}

const Tickets = () => {
  const { user, profile, company, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showTechnicalNotes, setShowTechnicalNotes] = useState(false);
  const [technicalNotesTicket, setTechnicalNotesTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (company && profile) {
      loadTickets();
    }
  }, [company, profile]);

  // Verificar se deve abrir o formulário de novo ticket automaticamente
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowTicketForm(true);
      // Remover o parâmetro da URL após abrir o formulário
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      
      // Filtra tickets baseado no role do usuário
      let query = supabase
        .from('tickets')
        .select(`
          *,
          categories (name),
          clients (id, name, email, phone, address, company_name, document)
        `);

      // Para clientes, mostrar apenas os tickets que eles criaram
      if (profile?.role === 'client') {
        query = query.eq('created_by', user?.id);
      } else {
        // Para masters e technicians, mostrar todos os tickets da empresa
        query = query.eq('company_id', company?.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as any || []);
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

  const handleCreateTicket = () => {
    setEditingTicket(null);
    setShowTicketForm(true);
  };

  const handleTicketClick = (ticket: Ticket) => {
    console.log('Ticket clicked:', ticket.title);
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    console.log('Edit ticket:', ticket.title);
    setEditingTicket(ticket);
    setShowTicketForm(true);
    setShowTicketDetails(false);
  };

  const handleTicketFormSuccess = () => {
    setShowTicketForm(false);
    setEditingTicket(null);
    loadTickets();
  };

  const handleShowHistory = (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryTicket(ticket);
    setShowHistory(true);
  };

  const handleExportPDF = (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    const companyData = company ? { name: company.name } : undefined;
    exportTicketToPDF(ticket, companyData);
  };

  const handleCreateTechnicalNote = (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation();
    setTechnicalNotesTicket(ticket);
    setShowTechnicalNotes(true);
    setShowTicketDetails(false);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // Atualizar ticket local
      const updatedTicket = { 
        ...selectedTicket, 
        status: newStatus,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
      };
      setSelectedTicket(updatedTicket);
      
      // Recarregar lista
      loadTickets();
      
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive'
      });
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!selectedTicket) return;
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // Atualizar ticket local
      const updatedTicket = { ...selectedTicket, priority: newPriority };
      setSelectedTicket(updatedTicket);
      
      // Recarregar lista
      loadTickets();
      
      toast({
        title: 'Sucesso',
        description: 'Prioridade atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar prioridade',
        variant: 'destructive'
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline'
    } as const;
    
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      urgent: 'destructive'
    } as const;
    
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  // Verificar se o usuário pode editar tickets (masters e technicians)
  const canEditTickets = profile?.role === 'master' || profile?.role === 'technician';

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || !company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 gap-4 py-4 sm:py-0">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold">📋 Chamados - Lista Compacta</h1>
                <span className="text-sm text-muted-foreground">
                  {filteredTickets.length} de {tickets.length} chamados
                </span>
              </div>
            </div>
            
            <Button onClick={handleCreateTicket} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Novo Chamado
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
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

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {loadingTickets ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {tickets.length === 0 ? 'Nenhum chamado encontrado' : 'Nenhum resultado'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {tickets.length === 0 
                ? 'Crie seu primeiro chamado para começar'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
            {tickets.length === 0 && (
              <Button onClick={handleCreateTicket}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Chamado
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">{/* Lista compacta */}
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleTicketClick(ticket)}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getPriorityIcon(ticket.priority || 'medium')}
                        <h3 className="font-medium text-sm truncate">{ticket.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                        {ticket.categories && (
                          <span>{ticket.categories.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(ticket.status || 'open')}
                      {getPriorityBadge(ticket.priority || 'medium')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Ticket Form Modal */}
      {showTicketForm && !editingTicket && (
        <TicketFormSimple
          onSuccess={handleTicketFormSuccess}
          onCancel={() => setShowTicketForm(false)}
        />
      )}
      
      {showTicketForm && editingTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edição Temporariamente Desabilitada</h2>
            <p className="text-sm text-gray-600 mb-4">
              A edição de tickets está temporariamente desabilitada durante a correção do formulário.
            </p>
            <Button onClick={() => setShowTicketForm(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedTicket && getPriorityIcon(selectedTicket.priority || 'medium')}
              <span>{selectedTicket?.title}</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {selectedTicket && (
                <>
                  {canEditTickets ? (
                    <Select 
                      value={selectedTicket.status || 'open'} 
                      onValueChange={(value: TicketStatus) => handleStatusChange(value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(selectedTicket.status || 'open')
                  )}
                  
                  {canEditTickets ? (
                    <Select 
                      value={selectedTicket.priority || 'medium'} 
                      onValueChange={(value: TicketPriority) => handlePriorityChange(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getPriorityBadge(selectedTicket.priority || 'medium')
                  )}
                </>
              )}
            </div>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Criado em:</span>
                    <br />
                    {new Date(selectedTicket.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Última atualização:</span>
                    <br />
                    {new Date(selectedTicket.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  {selectedTicket.categories && (
                    <div>
                      <span className="font-medium text-muted-foreground">Categoria:</span>
                      <br />
                      {selectedTicket.categories.name}
                    </div>
                  )}
                  
                  {selectedTicket.resolved_at && (
                    <div>
                      <span className="font-medium text-muted-foreground">Resolvido em:</span>
                      <br />
                      {new Date(selectedTicket.resolved_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Client Information */}
              {selectedTicket.clients && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-t pt-4">Informações do Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedTicket.clients.name && (
                      <div>
                        <span className="font-medium text-muted-foreground">Nome:</span>
                        <br />
                        {selectedTicket.clients.name}
                      </div>
                    )}
                    
                    {selectedTicket.clients.email && (
                      <div>
                        <span className="font-medium text-muted-foreground">Email:</span>
                        <br />
                        {selectedTicket.clients.email}
                      </div>
                    )}
                    
                    {selectedTicket.clients.phone && (
                      <div>
                        <span className="font-medium text-muted-foreground">Telefone:</span>
                        <br />
                        {selectedTicket.clients.phone}
                      </div>
                    )}
                    
                    {selectedTicket.clients.company_name && (
                      <div>
                        <span className="font-medium text-muted-foreground">Empresa:</span>
                        <br />
                        {selectedTicket.clients.company_name}
                      </div>
                    )}
                    
                    {selectedTicket.clients.document && (
                      <div>
                        <span className="font-medium text-muted-foreground">CPF/CNPJ:</span>
                        <br />
                        {selectedTicket.clients.document}
                      </div>
                    )}
                    
                    {selectedTicket.clients.address && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-muted-foreground">Endereço:</span>
                        <br />
                        {selectedTicket.clients.address}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {canEditTickets && (
                  <Button 
                    onClick={() => handleEditTicket(selectedTicket)}
                    size="sm"
                  >
                    Editar Chamado
                  </Button>
                )}
                
                {canEditTickets && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => handleCreateTechnicalNote(selectedTicket, e)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Notas Técnicas
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const companyData = company ? { name: company.name } : undefined;
                    exportTicketToPDF(selectedTicket, companyData);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setHistoryTicket(selectedTicket);
                    setShowHistory(true);
                    setShowTicketDetails(false);
                  }}
                >
                  <History className="w-4 h-4 mr-2" />
                  Ver Histórico
                </Button>
                
                <div onClick={(e) => e.stopPropagation()}>
                  <TicketShare ticketId={selectedTicket.id} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico do Ticket</DialogTitle>
            <DialogDescription>
              {historyTicket?.title}
            </DialogDescription>
          </DialogHeader>
          {historyTicket && <TicketHistory ticketId={historyTicket.id} />}
        </DialogContent>
      </Dialog>

      {/* Technical Notes Dialog */}
      <Dialog open={showTechnicalNotes} onOpenChange={setShowTechnicalNotes}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Notas Técnicas - {technicalNotesTicket?.title}</DialogTitle>
            <DialogDescription>
              Gerencie as notas técnicas deste chamado
            </DialogDescription>
          </DialogHeader>
          <div className="h-[75vh] overflow-hidden">
            {technicalNotesTicket && (
              <TechnicalNotesForTicket 
                ticketId={technicalNotesTicket.id}
                onClose={() => setShowTechnicalNotes(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;