import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, User } from 'lucide-react';

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority | null;
  status: TicketStatus | null;
  created_by: string;
  assigned_to?: string | null;
  category_id: string;
  client_id?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  name: string;
  role: string;
  user_id: string;
}

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  document?: string | null;
  active: boolean;
  type: 'client' | 'client_user'; // Para distinguir entre clientes sem login e com login
  user_id?: string; // Para clientes com login (vem da tabela profiles)
}

interface TicketFormProps {
  ticket?: Ticket | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticket, onSuccess, onCancel }) => {
  const { user, profile, company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: ''
  });
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: (ticket?.priority || 'medium') as TicketPriority,
    status: (ticket?.status || 'open') as TicketStatus,
    category_id: ticket?.category_id || '',
    assigned_to: ticket?.assigned_to || 'unassigned',
    client_id: ticket?.client_id || 'none'
  });

  const isEditing = !!ticket;
  const canAssignTickets = profile?.role === 'company_admin' || profile?.role === 'technician';
  const canChangeStatus = profile?.role === 'company_admin' || profile?.role === 'technician';
  const isClientUser = profile?.role === 'client_user';

  // Carregamento apenas quando o componente monta e tem os dados necessários
  useEffect(() => {
    if (user && profile && company?.id) {
      loadBasicData();
      
      // Se é client_user, criar automaticamente um cliente baseado no perfil
      if (isClientUser && !isEditing) {
        createOrFindClientForUser();
      }
    }
  }, [user, profile, company]);

  const loadBasicData = async () => {
    if (!company?.id) return;

    try {
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('active', true)
        .order('name');
      setCategories(categoriesData || []);

      // Carregar clientes (para técnicos e admins)
      if (!isClientUser) {
        // Carregar clientes sem login (da tabela clients)
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name, email, phone, company_name, active')
          .eq('company_id', company.id)
          .eq('active', true)
          .order('name');

        // Carregar clientes com login (da tabela profiles com role client_user)
        const { data: clientUsersData } = await supabase
          .from('profiles')
          .select('id, name, user_id, email_contato, telefone, razao_social')
          .eq('company_id', company.id)
          .eq('role', 'client_user')
          .eq('active', true)
          .order('name');

        // Combinar os dois tipos de clientes
        const allClients: Client[] = [
          ...(clientsData || []).map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            company_name: client.company_name,
            active: client.active,
            type: 'client' as const,
            address: null,
            document: null
          })),
          ...(clientUsersData || []).map(clientUser => ({
            id: clientUser.id,
            name: clientUser.name,
            email: clientUser.email_contato,
            phone: clientUser.telefone,
            company_name: clientUser.razao_social,
            active: true,
            type: 'client_user' as const,
            user_id: clientUser.user_id,
            address: null,
            document: null
          }))
        ];

        setClients(allClients);
      } else {
        // Se for cliente_user, buscar apenas os dados do próprio usuário
        const { data: ownClientData } = await supabase
          .from('profiles')
          .select('id, name, user_id, email_contato, telefone, razao_social')
          .eq('user_id', user?.id)
          .eq('role', 'client_user')
          .single();

        if (ownClientData) {
          // Verificar se já existe um cliente correspondente na tabela clients
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('name', ownClientData.name)
            .eq('company_id', company.id)
            .maybeSingle();

          let clientId = existingClient?.id;

          // Se não existe, criar um registro na tabela clients
          if (!clientId) {
            const { data: newClient, error: createError } = await supabase
              .from('clients')
              .insert({
                name: ownClientData.name,
                email: ownClientData.email_contato,
                phone: ownClientData.telefone,
                company_name: ownClientData.razao_social,
                company_id: company.id,
                active: true
              })
              .select('id')
              .single();

            if (createError) {
              console.error('Error creating client record:', createError);
            } else {
              clientId = newClient.id;
            }
          }

          if (clientId) {
            const clientAsClient: Client = {
              id: clientId,
              name: ownClientData.name,
              email: ownClientData.email_contato,
              phone: ownClientData.telefone,
              company_name: ownClientData.razao_social,
              active: true,
              type: 'client_user' as const,
              user_id: ownClientData.user_id,
              address: null,
              document: null
            };
            
            setClients([clientAsClient]);
            // Auto-selecionar o próprio cliente e atualizar o formData
            setFormData(prev => ({ 
              ...prev, 
              client_id: clientId
            }));
          }
        }
      }

      // Carregar técnicos se necessário
      if (canAssignTickets) {
        console.log('Carregando técnicos para company:', company.id);
        const { data: techniciansData, error: techError } = await supabase
          .from('profiles')
          .select('id, name, role, user_id, cpf_cnpj, razao_social, endereco, telefone, email_contato')
          .eq('company_id', company.id)
          .in('role', ['company_admin', 'technician', 'client_user'])
          .eq('active', true)
          .order('name');
        
        console.log('Resultado técnicos:', { techniciansData, techError });
        setTechnicians(techniciansData || []);
      }
    } catch (error) {
      console.error('Error loading basic data:', error);
    }
  };

  // Criar ou encontrar cliente para client_user
  const createOrFindClientForUser = async () => {
    if (!profile || !company) return;

    try {
      // Primeiro, verificar se já existe um cliente para este usuário
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', company.id)
        .eq('name', profile.name)
        .eq('active', true)
        .maybeSingle();

      if (existingClient) {
        setFormData(prev => ({ ...prev, client_id: existingClient.id }));
      } else {
        // Criar novo cliente baseado no perfil do usuário
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            company_id: company.id,
            name: profile.name,
            email: user?.email || null,
            active: true
          })
          .select('id')
          .single();

        if (error) throw error;
        
        if (newClient) {
          setFormData(prev => ({ ...prev, client_id: newClient.id }));
        }
      }
    } catch (error) {
      console.error('Error creating/finding client:', error);
    }
  };

  const createNewClient = async () => {
    if (!newClientData.name.trim() || !company) return;

    try {
      setCreatingCategory(true); // Reusing the same loading state
      
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          company_id: company.id,
          name: newClientData.name.trim(),
          email: newClientData.email.trim() || null,
          phone: newClientData.phone.trim() || null,
          company_name: newClientData.company_name.trim() || null,
          active: true
        })
        .select('id, name, email, phone, company_name, active')
        .single();

      if (error) throw error;

      if (newClient) {
        const clientToAdd: Client = {
          ...newClient,
          type: 'client',
          address: null,
          document: null
        };
        setClients(prev => [...prev, clientToAdd]);
        setFormData(prev => ({ ...prev, client_id: newClient.id }));
        setShowCreateClient(false);
        setNewClientData({ name: '', email: '', phone: '', company_name: '' });
        
        toast({
          title: 'Cliente criado',
          description: 'Novo cliente criado e selecionado com sucesso'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para a categoria',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreatingCategory(true);
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategoryName.trim(),
          company_id: company?.id,
          active: true
        }])
        .select('id, name')
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, category_id: data.id }));
      setNewCategoryName('');
      setShowCreateCategory(false);

      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso!'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria',
        variant: 'destructive'
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category_id) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Se o client_id selecionado é de um client_user (profiles), criar/encontrar o cliente correspondente na tabela clients
      let finalClientId = formData.client_id === 'none' || formData.client_id === '' ? null : formData.client_id;
      
      if (finalClientId) {
        const selectedClient = clients.find(c => c.id === finalClientId);
        if (selectedClient && selectedClient.type === 'client_user') {
          // É um client_user, precisa criar/encontrar registro na tabela clients
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('company_id', company.id)
            .eq('email', selectedClient.email || user?.email)
            .single();

          if (existingClient) {
            finalClientId = existingClient.id;
          } else {
            // Criar novo registro na tabela clients
            const { data: newClient, error: createError } = await supabase
              .from('clients')
              .insert({
                name: selectedClient.name,
                email: selectedClient.email || user?.email,
                phone: selectedClient.phone,
                company_name: selectedClient.company_name,
                company_id: company.id,
                active: true
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating client record:', createError);
              throw createError;
            }
            finalClientId = newClient.id;
          }
        }
      }

      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        category_id: formData.category_id,
        company_id: company.id,
        created_by: user.id,
        assigned_to: formData.assigned_to === 'unassigned' || formData.assigned_to === '' ? null : formData.assigned_to,
        client_id: finalClientId
      };

      console.log('🔍 FINAL TICKET DATA:', {
        originalClientId: formData.client_id,
        finalClientId,
        ticketData
      });

      if (isEditing) {
        console.log('🔄 DEBUGGING UPDATE - Current user profile:', {
          userId: user?.id,
          userEmail: user?.email,
          profileRole: profile?.role,
          companyId: company?.id,
          ticketId: ticket!.id,
          isEditing: true
        });
        
        const { error, data } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', ticket!.id)
          .select();
          
        if (error) {
          console.error('❌ UPDATE ERROR DETAILS:', {
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            fullError: error
          });
          throw error;
        }
        
        console.log('✅ Update successful, data:', data);
      } else {
        console.log('Creating new ticket with data:', ticketData);
        const { error } = await supabase
          .from('tickets')
          .insert([ticketData]);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Ticket created successfully');
      }

      toast({
        title: 'Sucesso',
        description: `Chamado ${isEditing ? 'atualizado' : 'criado'} com sucesso!`
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        title: 'Erro',
        description: `Erro ao ${isEditing ? 'atualizar' : 'criar'} chamado`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Se não há usuário autenticado, não renderizar o formulário
  if (!user || !profile) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Chamado' : 'Novo Chamado'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do chamado'
              : 'Preencha as informações para criar um novo chamado'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título do chamado"
              required
            />
          </div>

          {/* Campo de Cliente - unificado para todos os tipos de usuário */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </Label>
            
            {isClientUser ? (
              /* Para client_users - mostrar informação do próprio cliente */
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{profile?.name}</p>
                <p className="text-xs text-muted-foreground">Chamado será criado em seu nome</p>
              </div>
            ) : (
              /* Para técnicos/admins - campo de seleção */
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selecione um cliente (opcional)</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateClient(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Novo cliente
                  </Button>
                </div>
                
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum cliente</SelectItem>
                     {clients.map((client) => (
                       <SelectItem key={client.id} value={client.id}>
                         {client.name}
                         {client.company_name && ` - ${client.company_name}`}
                         {client.email && ` (${client.email})`}
                         {client.type === 'client_user' && ' [Com Login]'}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Formulário para criar novo cliente - só para admins e técnicos */}
          {!isClientUser && showCreateClient && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Label>Novo cliente</Label>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Nome do cliente *"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                />
                <Input
                  placeholder="Telefone"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                />
                <Input
                  placeholder="Empresa"
                  value={newClientData.company_name}
                  onChange={(e) => setNewClientData({ ...newClientData, company_name: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={createNewClient}
                  disabled={creatingCategory || !newClientData.name.trim()}
                  size="sm"
                >
                  {creatingCategory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Criar'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateClient(false)}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o problema ou solicitação"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Categoria *</Label>
              {categories.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCategory(true)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Criar categoria
                </Button>
              )}
            </div>
            
            {categories.length > 0 ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCategory(true)}
                  className="px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhuma categoria encontrada
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateCategory(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira categoria
                </Button>
              </div>
            )}

            {showCreateCategory && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <Label htmlFor="newCategory">Nova categoria</Label>
                <div className="flex gap-2">
                  <Input
                    id="newCategory"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createCategory();
                      } else if (e.key === 'Escape') {
                        setShowCreateCategory(false);
                        setNewCategoryName('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={createCategory}
                    disabled={creatingCategory}
                    size="sm"
                  >
                    {creatingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Criar'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateCategory(false);
                      setNewCategoryName('');
                    }}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canChangeStatus && isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {canAssignTickets && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Atribuir a</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Não atribuído</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.user_id} value={tech.user_id}>
                      {tech.name} ({
                        tech.role === 'company_admin' ? 'Admin' : 
                        tech.role === 'technician' ? 'Técnico' : 
                        'Cliente'
                      })
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketForm;