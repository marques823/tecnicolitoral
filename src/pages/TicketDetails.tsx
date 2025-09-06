import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, User, Building2, Tag, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import TicketComments from '@/components/TicketComments';
import TicketHistory from '@/components/TicketHistory';

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category_id: string;
  client_id: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  categories?: {
    name: string;
  } | null;
  clients?: {
    name: string;
  } | null;
  creator_profile?: {
    name: string;
  } | null;
  assigned_profile?: {
    name: string;
  } | null;
}

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId, user, profile]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      
      // Buscar ticket básico primeiro
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          categories(name),
          clients(name)
        `)
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketError) {
        console.error('Error loading ticket:', ticketError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o chamado.",
          variant: "destructive",
        });
        navigate('/tickets');
        return;
      }

      if (!ticket) {
        toast({
          title: "Erro",
          description: "Chamado não encontrado ou você não tem acesso a ele.",
          variant: "destructive",
        });
        navigate('/tickets');
        return;
      }

      // Buscar informações dos usuários usando a função RPC
      const userIds = [ticket.created_by, ticket.assigned_to].filter(Boolean);
      let profiles = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .rpc('get_basic_profiles', { target_company_id: profile.company_id })
          .in('user_id', userIds);
        
        profiles = profilesData || [];
      }

      const creatorProfile = profiles.find(p => p.user_id === ticket.created_by);
      const assignedProfile = profiles.find(p => p.user_id === ticket.assigned_to);

      setTicket({
        ...ticket,
        creator_profile: creatorProfile ? { name: creatorProfile.name } : null,
        assigned_profile: assignedProfile ? { name: assignedProfile.name } : null
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar o chamado.",
        variant: "destructive",
      });
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
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

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getPriorityVariant = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      urgent: 'destructive'
    } as const;
    return variants[priority as keyof typeof variants] || 'outline';
  };

  const canAddComments = () => {
    if (!profile || !ticket) return false;
    
    // Cliente só pode comentar se for o criador do ticket
    if (profile.role === 'client_user') {
      return ticket.created_by === user?.id;
    }
    
    // Técnicos e admins podem comentar
    return profile.role === 'technician' || profile.role === 'company_admin';
  };

  const canEdit = () => {
    return profile?.role === 'company_admin' || profile?.role === 'technician';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Chamado não encontrado</h2>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para chamados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/tickets')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          {canEdit() && (
            <Button onClick={() => navigate(`/tickets/edit/${ticket.id}`)}>
              Editar Chamado
            </Button>
          )}
        </div>

        {/* Ticket Details */}
        <Card className="bg-gradient-card border-white/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">{getStatusLabel(ticket.status)}</span>
                  </Badge>
                  <Badge variant={getPriorityVariant(ticket.priority)}>
                    {getPriorityLabel(ticket.priority)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            <Separator />

            {/* Ticket Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Criado por:</span>
                  <span className="text-sm">{ticket.creator_profile?.name || 'Usuário desconhecido'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cliente:</span>
                  <span className="text-sm">{ticket.clients?.name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Categoria:</span>
                  <span className="text-sm">{ticket.categories?.name || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Criado em:</span>
                  <span className="text-sm">
                    {new Date(ticket.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {ticket.assigned_to && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Atribuído a:</span>
                    <span className="text-sm">{ticket.assigned_profile?.name || 'Usuário desconhecido'}</span>
                  </div>
                )}
                
                {ticket.resolved_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Resolvido em:</span>
                    <span className="text-sm">
                      {new Date(ticket.resolved_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-gradient-card border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Comentários</CardTitle>
            <CardDescription>
              Histórico de comentários e atualizações do chamado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TicketComments 
              ticketId={ticket.id} 
              canAddComments={canAddComments()} 
            />
          </CardContent>
        </Card>

        {/* History Section */}
        <Card className="bg-gradient-card border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              Registro de todas as alterações realizadas no chamado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TicketHistory ticketId={ticket.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketDetails;