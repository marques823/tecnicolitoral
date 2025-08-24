import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TicketFormSimpleProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const TicketFormSimple: React.FC<TicketFormSimpleProps> = ({ onSuccess, onCancel }) => {
  const { user, profile, company } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  console.log('🎫 TicketFormSimple renderizado com:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    hasCompany: !!company 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (!user || !company) {
      toast({
        title: 'Erro',
        description: 'Dados de autenticação não encontrados',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Criar uma categoria padrão se não existir
      let categoryId = '';
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('company_id', company.id)
        .limit(1);

      if (!categories || categories.length === 0) {
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert([{
            name: 'Geral',
            company_id: company.id,
            active: true
          }])
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      } else {
        categoryId = categories[0].id;
      }

      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: 'medium' as const,
        category_id: categoryId,
        company_id: company.id,
        created_by: user.id
      };

      const { error } = await supabase
        .from('tickets')
        .insert([ticketData]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Chamado criado com sucesso!'
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar chamado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || !company) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando dados de autenticação...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Chamado (Versão Simplificada)</DialogTitle>
          <DialogDescription>
            Preencha as informações básicas para criar um novo chamado
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketFormSimple;