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
import { Loader2 } from 'lucide-react';

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_by: string;
  assigned_to?: string;
  category_id: string;
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

interface TicketFormProps {
  ticket?: Ticket | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticket, onSuccess, onCancel }) => {
  const { profile, company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    status: 'open' as TicketStatus,
    category_id: '',
    assigned_to: 'unassigned'
  });

  const isEditing = !!ticket;
  const canAssignTickets = profile?.role === 'master' || profile?.role === 'technician';
  const canChangeStatus = profile?.role === 'master' || profile?.role === 'technician';

  useEffect(() => {
    loadCategories();
    if (canAssignTickets) {
      loadTechnicians();
    }

    if (ticket) {
        setFormData({
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          category_id: ticket.category_id,
          assigned_to: ticket.assigned_to || 'unassigned'
        });
    }
  }, [ticket, canAssignTickets]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', company?.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
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

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, user_id')
        .eq('company_id', company?.id)
        .in('role', ['master', 'technician'])
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
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

      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category_id: formData.category_id,
        company_id: company?.id,
        ...(isEditing && canChangeStatus && { status: formData.status }),
        ...(canAssignTickets && formData.assigned_to !== 'unassigned' && { assigned_to: formData.assigned_to }),
        ...(!isEditing && { created_by: profile?.user_id })
      };

      let error;
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', ticket.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tickets')
          .insert([ticketData]);
        error = insertError;
      }

      if (error) throw error;

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

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
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
            <Label htmlFor="category">Categoria *</Label>
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
                      {tech.name} ({tech.role === 'master' ? 'Master' : 'Técnico'})
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