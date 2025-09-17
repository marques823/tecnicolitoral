import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, FileText, Edit, Trash2, Download, Camera, X, Monitor, Settings, Wrench, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import jsPDF from 'jspdf';

interface TechnicalNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  created_by: string;
  ticket_id?: string;
  devices_info?: any;
  services_performed?: string[];
  services_needed?: string[];
  photos?: string[];
  equipment_models?: string[];
  problem_description?: string;
  solution_description?: string;
  observations?: string;
}

interface TicketInfo {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  categories?: { name: string };
  clients?: { name: string };
}

const noteSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  tags: z.string().optional(),
  is_public: z.boolean().default(false),
  problem_description: z.string().optional(),
  solution_description: z.string().optional(),
  observations: z.string().optional(),
  equipment_models: z.string().optional(),
  services_performed: z.string().optional(),
  services_needed: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface TechnicalNotesForTicketProps {
  ticketId: string;
  onClose?: () => void;
}

export default function TechnicalNotesForTicket({ ticketId, onClose }: TechnicalNotesForTicketProps) {
  const { profile, company } = useAuth();
  const [notes, setNotes] = useState<TechnicalNote[]>([]);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TechnicalNote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      is_public: false,
      problem_description: "",
      solution_description: "",
      observations: "",
      equipment_models: "",
      services_performed: "",
      services_needed: "",
    },
  });

  useEffect(() => {
    if (profile && company) {
      loadTicketInfo();
      loadNotes();
    }
  }, [ticketId, profile, company]);

  const loadTicketInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id, title, description, status, priority,
          categories(name),
          clients(name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicketInfo(data);
    } catch (error) {
      console.error('Erro ao carregar informações do ticket:', error);
      toast.error('Erro ao carregar informações do ticket');
    }
  };

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("technical_notes")
        .select("*")
        .eq("company_id", company!.id)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      toast.error("Erro ao carregar notas técnicas");
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotos = async (noteId: string, files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${noteId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('technical-notes')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        toast.error(`Erro ao fazer upload da foto: ${file.name}`);
      } else {
        uploadedUrls.push(fileName);
      }
    }
    
    return uploadedUrls;
  };

  const handleSaveNote = async (data: NoteFormData) => {
    try {
      setUploading(true);
      const tags = data.tags ? data.tags.split(",").map(tag => tag.trim()) : [];
      const equipmentModels = data.equipment_models ? data.equipment_models.split(",").map(model => model.trim()) : [];
      const servicesPerformed = data.services_performed ? data.services_performed.split(",").map(service => service.trim()) : [];
      const servicesNeeded = data.services_needed ? data.services_needed.split(",").map(service => service.trim()) : [];
      
      // Pré-popular título e conteúdo com informações do ticket se não fornecido
      let noteTitle = data.title;
      let noteContent = data.content;
      
      if (!noteTitle && ticketInfo) {
        noteTitle = `Nota Técnica - ${ticketInfo.title}`;
      }
      
      if (!noteContent && ticketInfo) {
        noteContent = `Nota técnica relacionada ao chamado: ${ticketInfo.title}\n\nDescrição do chamado: ${ticketInfo.description}`;
      }
      
      let noteData = {
        title: noteTitle,
        content: noteContent,
        tags,
        is_public: data.is_public,
        ticket_id: ticketId,
        problem_description: data.problem_description || null,
        solution_description: data.solution_description || null,
        observations: data.observations || null,
        equipment_models: equipmentModels,
        services_performed: servicesPerformed,
        services_needed: servicesNeeded,
        photos: [] as string[],
      };

      let noteId: string;

      if (editingNote) {
        const { error } = await supabase
          .from("technical_notes")
          .update(noteData)
          .eq("id", editingNote.id);

        if (error) throw error;
        noteId = editingNote.id;
        toast.success("Nota técnica atualizada com sucesso!");
      } else {
        const { data: newNote, error } = await supabase
          .from("technical_notes")
          .insert({
            ...noteData,
            company_id: company!.id,
            created_by: profile!.user_id,
          })
          .select()
          .single();

        if (error) throw error;
        noteId = newNote.id;
        toast.success("Nota técnica criada com sucesso!");
      }

      // Upload de fotos se houver
      if (uploadedFiles.length > 0) {
        const photoUrls = await uploadPhotos(noteId, uploadedFiles);
        
        if (photoUrls.length > 0) {
          const { error: updateError } = await supabase
            .from("technical_notes")
            .update({ photos: photoUrls })
            .eq("id", noteId);

          if (updateError) throw updateError;
        }
      }

      setIsDialogOpen(false);
      setEditingNote(null);
      setUploadedFiles([]);
      form.reset();
      loadNotes();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      toast.error("Erro ao salvar nota técnica");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    try {
      // Buscar fotos associadas para deletar do storage
      const { data: note } = await supabase
        .from("technical_notes")
        .select("photos")
        .eq("id", noteId)
        .single();

      if (note?.photos && note.photos.length > 0) {
        await supabase.storage
          .from('technical-notes')
          .remove(note.photos);
      }

      const { error } = await supabase
        .from("technical_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
      toast.success("Nota técnica excluída com sucesso!");
      loadNotes();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast.error("Erro ao excluir nota técnica");
    }
  };

  const handleEditNote = (note: TechnicalNote) => {
    setEditingNote(note);
    form.reset({
      title: note.title,
      content: note.content,
      tags: note.tags?.join(", ") || "",
      is_public: note.is_public,
      problem_description: note.problem_description || "",
      solution_description: note.solution_description || "",
      observations: note.observations || "",
      equipment_models: note.equipment_models?.join(", ") || "",
      services_performed: note.services_performed?.join(", ") || "",
      services_needed: note.services_needed?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error("Apenas arquivos de imagem são permitidos");
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const exportToPDF = (note: TechnicalNote) => {
    const doc = new jsPDF();
    let y = 30;
    
    // Cabeçalho com informações do ticket
    doc.setFontSize(16);
    doc.text(`Nota Técnica - ${ticketInfo?.title || 'Ticket'}`, 20, y);
    y += 15;
    
    if (ticketInfo) {
      doc.setFontSize(10);
      doc.text(`Ticket ID: ${ticketInfo.id}`, 20, y);
      y += 8;
      doc.text(`Cliente: ${ticketInfo.clients?.name || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Categoria: ${ticketInfo.categories?.name || 'N/A'}`, 20, y);
      y += 15;
    }
    
    // Título da nota
    doc.setFontSize(14);
    doc.text(note.title, 20, y);
    y += 15;
    
    // Data
    doc.setFontSize(10);
    doc.text(`Data: ${new Date(note.created_at).toLocaleDateString('pt-BR')}`, 20, y);
    y += 15;
    
    // Problema
    if (note.problem_description) {
      doc.setFontSize(12);
      doc.text("Problema:", 20, y);
      y += 8;
      doc.setFontSize(10);
      const problemLines = doc.splitTextToSize(note.problem_description, 170);
      doc.text(problemLines, 20, y);
      y += problemLines.length * 5 + 10;
    }
    
    // Solução
    if (note.solution_description) {
      doc.setFontSize(12);
      doc.text("Solução:", 20, y);
      y += 8;
      doc.setFontSize(10);
      const solutionLines = doc.splitTextToSize(note.solution_description, 170);
      doc.text(solutionLines, 20, y);
      y += solutionLines.length * 5 + 10;
    }
    
    // Equipamentos
    if (note.equipment_models?.length) {
      doc.setFontSize(12);
      doc.text("Equipamentos:", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(note.equipment_models.join(', '), 20, y);
      y += 15;
    }
    
    // Conteúdo
    doc.setFontSize(12);
    doc.text("Detalhes:", 20, y);
    y += 8;
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(note.content, 170);
    doc.text(contentLines, 20, y);
    
    doc.save(`nota-tecnica-${ticketInfo?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'nota'}-${note.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
  };

  const getPhotoUrl = (photoPath: string) => {
    const { data } = supabase.storage
      .from('technical-notes')
      .getPublicUrl(photoPath);
    return data.publicUrl;
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    note.problem_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.solution_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header com informações do ticket */}
      {ticketInfo && (
        <Card className="bg-gradient-card border-white/20 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{ticketInfo.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {ticketInfo.clients?.name && `Cliente: ${ticketInfo.clients.name} • `}
                  {ticketInfo.categories?.name && `Categoria: ${ticketInfo.categories.name}`}
                </p>
              </div>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Voltar
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Notas Técnicas</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Notas técnicas vinculadas a este chamado
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingNote(null);
              setUploadedFiles([]);
              form.reset();
            }} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? "Editar Nota Técnica" : "Nova Nota Técnica"}
              </DialogTitle>
              <DialogDescription>
                Crie ou edite uma nota técnica vinculada ao chamado: {ticketInfo?.title}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveNote)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="text-xs lg:text-sm">Básico</TabsTrigger>
                    <TabsTrigger value="technical" className="text-xs lg:text-sm">Técnico</TabsTrigger>
                    <TabsTrigger value="services" className="text-xs lg:text-sm">Serviços</TabsTrigger>
                    <TabsTrigger value="photos" className="text-xs lg:text-sm">Fotos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={`Nota técnica - ${ticketInfo?.title || 'Título da nota'}`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Geral</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descrição geral do serviço realizado" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (separadas por vírgula)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: hardware, software, rede" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="is_public"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Nota Pública</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Tornar esta nota visível para todos da empresa
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="problem_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Descrição do Problema
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o problema encontrado" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="solution_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Descrição da Solução
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva a solução aplicada" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="equipment_models"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Modelos de Equipamentos (separados por vírgula)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Dell OptiPlex 7070, HP LaserJet Pro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Adicionais</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações importantes ou notas adicionais" 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="services" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="services_performed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviços Realizados (separados por vírgula)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Troca de HD, Limpeza interna, Atualização de drivers" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="services_needed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviços Necessários (separados por vírgula)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Upgrade de memória, Substituição de fonte" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="photos" className="space-y-4">
                    <div>
                      <FormLabel>Fotos do Serviço</FormLabel>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload">
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <Camera className="h-4 w-4 mr-2" />
                              Adicionar Fotos
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Fotos selecionadas:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Salvando..." : editingNote ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="w-full max-w-md">
        <Input
          placeholder="Buscar notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Notes Grid */}
      <div className="grid gap-4 sm:gap-6">
        {filteredNotes.length === 0 ? (
          <div className="bg-background border rounded-lg p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "Nenhuma nota encontrada" : "Nenhuma nota técnica"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Tente ajustar sua busca ou limpar os filtros"
                : "Crie sua primeira nota técnica para este chamado"
              }
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      {note.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Pública
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString('pt-BR')} às {' '}
                      {new Date(note.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToPDF(note)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.problem_description && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Problema
                    </h4>
                    <p className="text-sm text-muted-foreground">{note.problem_description}</p>
                  </div>
                )}
                
                {note.solution_description && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Solução
                    </h4>
                    <p className="text-sm text-muted-foreground">{note.solution_description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm mb-1">Detalhes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                </div>

                {note.equipment_models && note.equipment_models.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Equipamentos
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {note.equipment_models.map((model, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {note.services_performed && note.services_performed.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Serviços Realizados</h4>
                    <div className="flex flex-wrap gap-1">
                      {note.services_performed.map((service, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {note.photos && note.photos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Fotos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {note.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={getPhotoUrl(photo)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(getPhotoUrl(photo), '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}