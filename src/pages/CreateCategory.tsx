import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  const editingCategoryId = searchParams.get('edit');
  const isEditing = !!editingCategoryId;

  useEffect(() => {
    if (isEditing && editingCategoryId) {
      loadCategoryData(editingCategoryId);
    }
  }, [isEditing, editingCategoryId]);

  const loadCategoryData = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          active: data.active
        });
      }
    } catch (error) {
      console.error('Error loading category data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da categoria',
        variant: 'destructive'
      });
      navigate('/categories');
    }
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

    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        company_id: company.id,
        active: formData.active
      };

      if (isEditing && editingCategoryId) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategoryId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Categoria atualizada com sucesso!'
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Categoria criada com sucesso!'
        });
      }

      navigate('/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar categoria',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/categories')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Categoria' : 'Criar Nova Categoria'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da categoria"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">
                  {formData.active ? 'Ativa' : 'Inativa'}
                </Label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/categories')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar' : 'Criar'} Categoria
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}