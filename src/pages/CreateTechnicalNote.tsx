import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';

export default function CreateTechnicalNote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, company } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const ticketId = searchParams.get('ticket_id');
  const editingNoteId = searchParams.get('edit');
  const isEditing = !!editingNoteId;
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    problem_description: '',
    solution_description: '',
    observations: '',
    is_public: false,
    services_performed: [''],
    services_needed: [''],
    equipment_models: [''],
    tags: [''],
    photos: ['']
  });

  useEffect(() => {
    if (isEditing && editingNoteId) {
      loadNoteData(editingNoteId);
    }
  }, [isEditing, editingNoteId]);

  const loadNoteData = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('technical_notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          content: data.content || '',
          problem_description: data.problem_description || '',
          solution_description: data.solution_description || '',
          observations: data.observations || '',
          is_public: data.is_public || false,
          services_performed: data.services_performed || [''],
          services_needed: data.services_needed || [''],
          equipment_models: data.equipment_models || [''],
          tags: data.tags || [''],
          photos: data.photos || ['']
        });
      }
    } catch (error) {
      console.error('Error loading note:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar nota técnica',
        variant: 'destructive'
      });
    }
  };

  const handleArrayChange = (field: keyof typeof formData, index: number, value: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: keyof typeof formData) => {
    const newArray = [...(formData[field] as string[]), ''];
    setFormData({ ...formData, [field]: newArray });
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    const newArray = (formData[field] as string[]).filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
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

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Erro',
        description: 'Título e conteúdo são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const noteData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        problem_description: formData.problem_description.trim() || null,
        solution_description: formData.solution_description.trim() || null,
        observations: formData.observations.trim() || null,
        is_public: formData.is_public,
        company_id: company.id,
        created_by: user.id,
        ticket_id: ticketId || null,
        services_performed: formData.services_performed.filter(s => s.trim() !== ''),
        services_needed: formData.services_needed.filter(s => s.trim() !== ''),
        equipment_models: formData.equipment_models.filter(s => s.trim() !== ''),
        tags: formData.tags.filter(s => s.trim() !== ''),
        photos: formData.photos.filter(s => s.trim() !== '')
      };

      if (isEditing && editingNoteId) {
        const { error } = await supabase
          .from('technical_notes')
          .update(noteData)
          .eq('id', editingNoteId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Nota técnica atualizada com sucesso!'
        });
      } else {
        const { error } = await supabase
          .from('technical_notes')
          .insert([noteData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Nota técnica criada com sucesso!'
        });
      }

      if (ticketId) {
        navigate(`/tickets/${ticketId}`);
      } else {
        navigate('/technical-notes');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar nota técnica',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const ArrayField = ({ 
    label, 
    field, 
    placeholder 
  }: { 
    label: string; 
    field: keyof typeof formData; 
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {(formData[field] as string[]).map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {(formData[field] as string[]).length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeArrayItem(field, index)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addArrayItem(field)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar {label.toLowerCase()}
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Nota Técnica' : 'Nova Nota Técnica'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Nota Técnica' : 'Criar Nova Nota Técnica'}
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
                  placeholder="Digite o título da nota técnica"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_public: checked as boolean })
                  }
                />
                <Label htmlFor="is_public">Nota pública</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Descreva detalhadamente a nota técnica"
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="problem_description">Descrição do Problema</Label>
                <Textarea
                  id="problem_description"
                  value={formData.problem_description}
                  onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                  placeholder="Descreva o problema encontrado"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution_description">Descrição da Solução</Label>
                <Textarea
                  id="solution_description"
                  value={formData.solution_description}
                  onChange={(e) => setFormData({ ...formData, solution_description: e.target.value })}
                  placeholder="Descreva a solução aplicada"
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ArrayField
                label="Serviços Realizados"
                field="services_performed"
                placeholder="Digite um serviço realizado"
              />

              <ArrayField
                label="Serviços Necessários"
                field="services_needed"
                placeholder="Digite um serviço necessário"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ArrayField
                label="Modelos de Equipamentos"
                field="equipment_models"
                placeholder="Digite um modelo de equipamento"
              />

              <ArrayField
                label="Tags"
                field="tags"
                placeholder="Digite uma tag"
              />
            </div>

            <ArrayField
              label="Fotos (URLs)"
              field="photos"
              placeholder="Digite uma URL de foto"
            />

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar' : 'Criar'} Nota Técnica
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}