import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface Category {
  id: string;
  name: string;
  active: boolean;
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    status: 'open' as TicketStatus,
    category_id: '',
    assigned_to: '',
    client_id: '',
    new_category_name: '',
    new_client_name: '',
    new_client_email: '',
    new_client_phone: ''
  });

  const editingTicketId = searchParams.get('edit');
  const isEditing = !!editingTicketId;

  useEffect(() => {
    if (user && profile && company) {
      loadInitialData();
    }
  }, [user, profile, company]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadTechnicians(),
        loadClients()
      ]);

      if (isEditing && editingTicketId) {
        await loadTicketData(editingTicketId);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadCategories = async () => {
    if (!company) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, active')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('name');

    if (error) throw error;
    setCategories(data || []);
  };

  const loadTechnicians = async () => {
    if (!company || profile?.role === 'client_user') return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('company_id', company.id)
      .in('role', ['technician', 'company_admin'])
      .eq('active', true)
      .order('name');

    if (error) throw error;
    setTechnicians(data || []);
  };

  const loadClients = async () => {
    if (!company || profile?.role === 'client_user') return;
    
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, company_name')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('name');

    if (error) throw error;
    setClients(data || []);
  };

  const loadTicketData = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;

    if (data) {
      setFormData({
        ...formData,
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        status: data.status || 'open',
        category_id: data.category_id,
        assigned_to: data.assigned_to || '',
        client_id: data.client_id || ''
      });
    }
  };

  const createCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim(),
        company_id: company!.id,
        active: true
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  };

  const createClient = async () => {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: formData.new_client_name.trim(),
        email: formData.new_client_email.trim() || null,
        phone: formData.new_client_phone.trim() || null,
        company_id: company!.id,
        active: true
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile || !company) {
      toast({
        title: 'Erro',
        description: 'Dados de autenticação não encontrados',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Erro',
        description: 'Título e descrição são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      let categoryId = formData.category_id;
      let clientId = formData.client_id;

      // Create new category if needed
      if (formData.new_category_name.trim()) {
        categoryId = await createCategory(formData.new_category_name);
      }

      // Create new client if needed
      if (formData.new_client_name.trim()) {
        clientId = await createClient();
      }

      // Ensure we have a category
      if (!categoryId) {
        if (categories.length === 0) {
          categoryId = await createCategory('Geral');
        } else {
          categoryId = categories[0].id;
        }
      }

      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        category_id: categoryId,
        company_id: company.id,
        created_by: user.id,
        assigned_to: formData.assigned_to || null,
        client_id: clientId || null
      };

      if (isEditing && editingTicketId) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', editingTicketId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Chamado atualizado com sucesso!'
        });
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert([ticketData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Chamado criado com sucesso!'
        });
      }

      navigate('/tickets');
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar chamado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Chamado' : 'Novo Chamado'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Chamado' : 'Criar Novo Chamado'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value: TicketPriority) => 
                  setFormData({ ...formData, priority: value })
                }>
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

              {profile?.role !== 'client_user' && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: TicketStatus) => 
                    setFormData({ ...formData, status: value })
                  }>
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

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category_id} onValueChange={(value) => 
                  setFormData({ ...formData, category_id: value })
                }>
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

              <div className="space-y-2">
                <Label htmlFor="new_category">Nova Categoria (opcional)</Label>
                <Input
                  id="new_category"
                  value={formData.new_category_name}
                  onChange={(e) => setFormData({ ...formData, new_category_name: e.target.value })}
                  placeholder="Digite o nome da nova categoria"
                />
              </div>

              {profile?.role !== 'client_user' && technicians.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Atribuir para</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => 
                    setFormData({ ...formData, assigned_to: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não atribuído</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {profile?.role !== 'client_user' && clients.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={formData.client_id} onValueChange={(value) => 
                    setFormData({ ...formData, client_id: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company_name && `(${client.company_name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {profile?.role !== 'client_user' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Novo Cliente (opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_client_name">Nome do Cliente</Label>
                    <Input
                      id="new_client_name"
                      value={formData.new_client_name}
                      onChange={(e) => setFormData({ ...formData, new_client_name: e.target.value })}
                      placeholder="Nome do novo cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_client_email">Email</Label>
                    <Input
                      id="new_client_email"
                      type="email"
                      value={formData.new_client_email}
                      onChange={(e) => setFormData({ ...formData, new_client_email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_client_phone">Telefone</Label>
                    <Input
                      id="new_client_phone"
                      value={formData.new_client_phone}
                      onChange={(e) => setFormData({ ...formData, new_client_phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva detalhadamente o problema ou solicitação"
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar' : 'Criar'} Chamado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}