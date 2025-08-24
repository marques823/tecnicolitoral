import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  document?: string | null;
  active: boolean;
}

interface ClientFormProps {
  client?: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSuccess, onCancel }) => {
  const { company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    company_name: client?.company_name || '',
    document: client?.document || ''
  });

  const isEditing = !!client;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do cliente é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        company_name: formData.company_name.trim() || null,
        document: formData.document.trim() || null,
        company_id: company?.id,
        active: true
      };

      let error;

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client!.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clients')
          .insert([clientData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Erro',
        description: `Erro ao ${isEditing ? 'atualizar' : 'criar'} cliente`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do cliente'
              : 'Preencha as informações para cadastrar um novo cliente'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Empresa</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Nome da empresa do cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">CPF/CNPJ</Label>
            <Input
              id="document"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Digite o endereço completo"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Criar'} Cliente
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;