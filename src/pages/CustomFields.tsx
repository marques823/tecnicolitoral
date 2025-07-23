import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Settings, AlertCircle } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean';
  options?: string[];
  required: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
}

interface FormData {
  name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean';
  options: string[];
  required: boolean;
  active: boolean;
}

export default function CustomFields() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [optionInput, setOptionInput] = useState('');
  const [hasCustomFields, setHasCustomFields] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    label: '',
    field_type: 'text',
    options: [],
    required: false,
    active: true
  });
  const { toast } = useToast();
  const { profile, company } = useAuth();

  const canManageFields = profile?.role === 'master';

  useEffect(() => {
    checkPlanSupport();
    loadCustomFields();
  }, []);

  const checkPlanSupport = async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          plans (has_custom_fields)
        `)
        .eq('id', company.id)
        .single();

      if (error) throw error;
      setHasCustomFields((data as any)?.plans?.has_custom_fields || false);
    } catch (error) {
      console.error('Erro ao verificar suporte a campos personalizados:', error);
    }
  };

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      
      const fieldsWithParsedOptions = data?.map(field => ({
        ...field,
        options: field.options ? field.options as string[] : undefined
      })) || [];
      
      setCustomFields(fieldsWithParsedOptions);
    } catch (error) {
      console.error('Erro ao carregar campos personalizados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar campos personalizados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.label.trim()) {
      toast({
        title: "Erro",
        description: "Nome e rótulo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.field_type === 'select' && formData.options.length === 0) {
      toast({
        title: "Erro",
        description: "Campos de seleção devem ter pelo menos uma opção",
        variant: "destructive",
      });
      return;
    }

    try {
      const maxSortOrder = Math.max(...customFields.map(f => f.sort_order), 0);
      
      const fieldData = {
        name: formData.name,
        label: formData.label,
        field_type: formData.field_type,
        options: formData.field_type === 'select' ? formData.options : null,
        required: formData.required,
        active: formData.active,
        sort_order: editingField ? editingField.sort_order : maxSortOrder + 1,
        company_id: profile?.company_id
      };

      if (editingField) {
        const { error } = await supabase
          .from('custom_fields')
          .update(fieldData)
          .eq('id', editingField.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('custom_fields')
          .insert(fieldData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo criado com sucesso",
        });
      }

      setDialogOpen(false);
      setEditingField(null);
      resetForm();
      loadCustomFields();
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar campo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      field_type: field.field_type,
      options: field.options || [],
      required: field.required,
      active: field.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (field: CustomField) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', field.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campo excluído com sucesso",
      });

      loadCustomFields();
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir campo",
        variant: "destructive",
      });
    }
  };

  const handleMoveField = async (field: CustomField, direction: 'up' | 'down') => {
    const currentIndex = customFields.findIndex(f => f.id === field.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= customFields.length) return;

    const targetField = customFields[targetIndex];

    try {
      const updates = [
        { id: field.id, sort_order: targetField.sort_order },
        { id: targetField.id, sort_order: field.sort_order }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('custom_fields')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      loadCustomFields();
    } catch (error) {
      console.error('Erro ao reordenar campos:', error);
      toast({
        title: "Erro",
        description: "Erro ao reordenar campos",
        variant: "destructive",
      });
    }
  };

  const addOption = () => {
    if (optionInput.trim() && !formData.options.includes(optionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      field_type: 'text',
      options: [],
      required: false,
      active: true
    });
    setOptionInput('');
  };

  const openNewFieldDialog = () => {
    setEditingField(null);
    resetForm();
    setDialogOpen(true);
  };

  const getFieldTypeLabel = (type: string) => {
    const labels = {
      text: 'Texto',
      textarea: 'Texto Longo',
      select: 'Seleção',
      number: 'Número',
      date: 'Data',
      boolean: 'Sim/Não'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!canManageFields) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Apenas usuários master podem gerenciar campos personalizados.
          </p>
        </div>
      </div>
    );
  }

  if (!hasCustomFields) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Recurso Não Disponível</h2>
          <p className="text-muted-foreground mb-4">
            Campos personalizados não estão incluídos no seu plano atual.
          </p>
          <Button onClick={() => window.location.href = '/plans'}>
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Carregando campos personalizados...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campos Personalizados</h1>
          <p className="text-muted-foreground">
            Configure campos adicionais para seus tickets
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewFieldDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Editar Campo' : 'Novo Campo Personalizado'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Campo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: numero_patrimonio"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome técnico (sem espaços ou caracteres especiais)
                  </p>
                </div>
                <div>
                  <Label htmlFor="label">Rótulo *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="ex: Número do Patrimônio"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Como será exibido no formulário
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="field_type">Tipo de Campo *</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value: any) => setFormData({ ...formData, field_type: value, options: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="textarea">Texto Longo</SelectItem>
                    <SelectItem value="select">Seleção</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="boolean">Sim/Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.field_type === 'select' && (
                <div>
                  <Label>Opções de Seleção</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Digite uma opção"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <Button type="button" onClick={addOption}>
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={formData.required}
                    onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                  />
                  <Label htmlFor="required">Campo obrigatório</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Campo ativo</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingField ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campos Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum campo personalizado configurado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveField(field, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveField(field, 'down')}
                          disabled={index === customFields.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell className="font-mono text-sm">{field.name}</TableCell>
                    <TableCell>{getFieldTypeLabel(field.field_type)}</TableCell>
                    <TableCell>
                      <Badge variant={field.required ? "default" : "outline"}>
                        {field.required ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={field.active ? "default" : "secondary"}>
                        {field.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(field)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(field)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}