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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

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

interface CustomField {
  id: string;
  name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean';
  options?: string[];
  required: boolean;
  active: boolean;
  sort_order: number;
}

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  document?: string | null;
}

interface TicketFormProps {
  ticket?: Ticket | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticket, onSuccess, onCancel }) => {
  const { user, profile, company } = useAuth();
  const { toast } = useToast();
  
  console.log('🎫 TicketForm renderizado com:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    hasCompany: !!company,
    userId: user?.id,
    profileRole: profile?.role,
    companyId: company?.id 
  });
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: (ticket?.priority || 'medium') as TicketPriority,
    status: (ticket?.status || 'open') as TicketStatus,
    category_id: ticket?.category_id || '',
    assigned_to: ticket?.assigned_to || 'unassigned',
    client_id: ticket?.client_id || ''
  });

  const isEditing = !!ticket;
  const canAssignTickets = profile?.role === 'master' || profile?.role === 'technician';
  const canChangeStatus = profile?.role === 'master' || profile?.role === 'technician';

  useEffect(() => {
    console.log('🎫 TicketForm useEffect - Dados de autenticação:', { user: !!user, profile: !!profile, company: !!company });
    
    // Aguardar carregamento dos dados de autenticação
    if (!user || !profile || !company) {
      console.log('🚨 Aguardando carregamento dos dados de autenticação...');
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        console.log('🔄 Carregando dados do formulário...');
        
        if (mounted) await loadCategories();
        if (mounted) await loadClients();
        if (mounted) await loadCustomFields();
        
        if (canAssignTickets && mounted) {
          await loadTechnicians();
        }
        
        if (isEditing && ticket && mounted) {
          await loadCustomFieldValues();
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    loadData();

    return () => {
      mounted = false;
    };
  }, [user?.id, profile?.id, company?.id]); // Dependências mais específicas

  const loadCategories = async () => {
    if (!company?.id) {
      console.log('❌ Empresa não carregada ainda');
      return;
    }

    try {
      console.log('🔄 Carregando categorias para empresa:', company.id);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      console.log('✅ Categorias carregadas:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias',
        variant: 'destructive'
      });
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

      // Adicionar a nova categoria à lista
      setCategories(prev => [...prev, data]);
      
      // Selecionar automaticamente a nova categoria
      setFormData(prev => ({ ...prev, category_id: data.id }));
      
      // Limpar o formulário de criação
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

  const loadClients = async () => {
    if (!company?.id) {
      console.log('❌ Empresa não carregada para carregar clientes');
      return;
    }

    try {
      console.log('🔄 Carregando clientes para empresa:', company.id);
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, address, company_name, document')
        .eq('company_id', company.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      console.log('✅ Clientes carregados:', data);
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadTechnicians = async () => {
    if (!company?.id) {
      console.log('❌ Empresa não carregada para carregar técnicos');
      return;
    }

    try {
      console.log('🔄 Carregando técnicos para empresa:', company.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, user_id')
        .eq('company_id', company.id)
        .in('role', ['master', 'technician'])
        .eq('active', true)
        .order('name');

      if (error) throw error;
      console.log('✅ Técnicos carregados:', data);
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadCustomFields = async () => {
    if (!company?.id) {
      console.log('❌ Empresa não carregada para carregar campos personalizados');
      return;
    }

    try {
      console.log('🔄 Carregando campos personalizados para empresa:', company.id);
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('company_id', company.id)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      
      const fieldsWithParsedOptions = data?.map(field => ({
        ...field,
        options: field.options ? field.options as string[] : undefined
      })) || [];
      
      console.log('✅ Campos personalizados carregados:', fieldsWithParsedOptions);
      setCustomFields(fieldsWithParsedOptions);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const loadCustomFieldValues = async () => {
    if (!ticket?.id) return;

    try {
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('custom_field_id, value')
        .eq('ticket_id', ticket.id);

      if (error) throw error;

      const values: Record<string, string> = {};
      data?.forEach(item => {
        values[item.custom_field_id] = item.value || '';
      });

      setCustomFieldValues(values);
    } catch (error) {
      console.error('Error loading custom field values:', error);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const validateCustomFields = () => {
    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]?.trim()) {
        toast({
          title: 'Erro',
          description: `O campo "${field.label}" é obrigatório`,
          variant: 'destructive'
        });
        return false;
      }
    }
    return true;
  };

  const saveCustomFieldValues = async (ticketId: string) => {
    if (customFields.length === 0) return;

    try {
      // Primeiro, remover valores existentes para campos que não estão mais sendo usados
      if (isEditing) {
        const { error: deleteError } = await supabase
          .from('custom_field_values')
          .delete()
          .eq('ticket_id', ticketId);

        if (deleteError) throw deleteError;
      }

      // Inserir novos valores
      const valuesToInsert = Object.entries(customFieldValues)
        .filter(([_, value]) => value.trim() !== '')
        .map(([fieldId, value]) => ({
          ticket_id: ticketId,
          custom_field_id: fieldId,
          value: value.trim()
        }));

      if (valuesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('custom_field_values')
          .insert(valuesToInsert);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving custom field values:', error);
      throw error;
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id] || '';
    
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.label.toLowerCase()}`}
            required={field.required}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(selectedValue) => handleCustomFieldChange(field.id, selectedValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={`Digite ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => handleCustomFieldChange(field.id, checked.toString())}
            />
            <span className="text-sm">
              {value === 'true' ? 'Sim' : 'Não'}
            </span>
          </div>
        );
      
      default:
        return null;
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

    // Validar campos personalizados
    if (!validateCustomFields()) {
      return;
    }

    try {
      setLoading(true);

      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category_id: formData.category_id,
        company_id: company?.id,
        client_id: formData.client_id || null,
        ...(isEditing && canChangeStatus && { status: formData.status }),
        ...(canAssignTickets && formData.assigned_to !== 'unassigned' && { assigned_to: formData.assigned_to }),
        ...(!isEditing && { created_by: user?.id })
      };

      let ticketId: string;
      let error;

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', ticket!.id);
        error = updateError;
        ticketId = ticket!.id;
      } else {
        const { data, error: insertError } = await supabase
          .from('tickets')
          .insert([ticketData])
          .select('id')
          .single();
        error = insertError;
        ticketId = data?.id;
      }

      if (error) throw error;

      // Salvar valores dos campos personalizados
      if (ticketId) {
        await saveCustomFieldValues(ticketId);
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

  // Loading state - aguardar carregamento dos dados essenciais
  if (!user || !profile || !company) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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

          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                    {client.company_name && ` - ${client.company_name}`}
                  </SelectItem>
                ))}
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
                      {tech.name} ({tech.role === 'master' ? 'Master' : 'Técnico'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos Personalizados */}
          {customFields.length > 0 && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Campos Personalizados</h3>
                <div className="space-y-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </div>
              </div>
            </>
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