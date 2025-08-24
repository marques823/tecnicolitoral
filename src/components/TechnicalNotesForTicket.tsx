import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, FileText, Edit, Trash2, Download, Camera, X, Monitor, Settings, Wrench, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import jsPDF from "jspdf";

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
    if (profile && company && ticketId) {
      loadNotes();
    }
  }, [profile, company, ticketId]);

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
      
      let noteData = {
        title: data.title,
        content: data.content,
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
    
    // Título
    doc.setFontSize(20);
    doc.text(note.title, 20, y);
    y += 20;
    
    // Data
    doc.setFontSize(12);
    doc.text(`Data: ${new Date(note.created_at).toLocaleDateString('pt-BR')}`, 20, y);
    y += 15;
    
    // Problema
    if (note.problem_description) {
      doc.setFontSize(14);
      doc.text("Problema:", 20, y);
      y += 10;
      doc.setFontSize(10);
      const problemLines = doc.splitTextToSize(note.problem_description, 170);
      doc.text(problemLines, 20, y);
      y += problemLines.length * 5 + 10;
    }
    
    // Solução
    if (note.solution_description) {
      doc.setFontSize(14);
      doc.text("Solução:", 20, y);
      y += 10;
      doc.setFontSize(10);
      const solutionLines = doc.splitTextToSize(note.solution_description, 170);
      doc.text(solutionLines, 20, y);
      y += solutionLines.length * 5 + 10;
    }
    
    // Equipamentos
    if (note.equipment_models?.length) {
      doc.setFontSize(14);
      doc.text("Equipamentos:", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(note.equipment_models.join(', '), 20, y);
      y += 15;
    }
    
    // Conteúdo
    doc.setFontSize(14);
    doc.text("Detalhes:", 20, y);
    y += 10;
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(note.content, 170);
    doc.text(contentLines, 20, y);
    
    doc.save(`nota-tecnica-${note.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
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
    <div className="h-full flex flex-col bg-background">
      {/* Header simplificado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b bg-card">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'}
          </span>
        </div>
        
        <Button onClick={() => {
          setEditingNote(null);
          setUploadedFiles([]);
          form.reset();
          setIsDialogOpen(true);
        }} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {notes.length === 0 ? 'Nenhuma nota técnica' : 'Nenhuma nota encontrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {notes.length === 0 
                ? 'Crie a primeira nota técnica para este chamado'
                : 'Tente ajustar os termos de busca'
              }
            </p>
            {notes.length === 0 && (
              <Button onClick={() => {
                setEditingNote(null);
                setUploadedFiles([]);
                form.reset();
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Nota
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportToPDF(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.is_public && (
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Pública
                      </Badge>
                    )}
                    {note.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {note.problem_description && (
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-1 mb-1">
                        <Settings className="h-3 w-3" />
                        Problema
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.problem_description}
                      </p>
                    </div>
                  )}
                  
                  {note.solution_description && (
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-1 mb-1">
                        <Wrench className="h-3 w-3" />
                        Solução
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.solution_description}
                      </p>
                    </div>
                  )}
                  
                  {note.equipment_models && note.equipment_models.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-1 mb-1">
                        <Monitor className="h-3 w-3" />
                        Equipamentos
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {note.equipment_models.slice(0, 3).map((model, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                        {note.equipment_models.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.equipment_models.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content}
                  </p>
                  
                  {note.photos && note.photos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-1 mb-2">
                        <Camera className="h-3 w-3" />
                        Fotos ({note.photos.length})
                      </h4>
                      <div className="flex gap-2 overflow-x-auto">
                        {note.photos.slice(0, 3).map((photo, index) => (
                          <img
                            key={index}
                            src={getPhotoUrl(photo)}
                            alt={`Foto ${index + 1}`}
                            className="h-16 w-16 object-cover rounded border flex-shrink-0"
                          />
                        ))}
                        {note.photos.length > 3 && (
                          <div className="h-16 w-16 bg-muted rounded border flex items-center justify-center text-xs font-medium flex-shrink-0">
                            +{note.photos.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {new Date(note.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Editar Nota Técnica" : "Nova Nota Técnica"}
            </DialogTitle>
            <DialogDescription>
              Crie ou edite uma nota técnica com informações detalhadas do serviço
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
                          <Input placeholder="Título da nota" {...field} />
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
                            placeholder="Descreva como o problema foi solucionado" 
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
                          <Input placeholder="Ex: Dell OptiPlex 7090, HP LaserJet Pro" {...field} />
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
                            placeholder="Observações gerais sobre o atendimento" 
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
                            placeholder="Ex: Instalação de software, Configuração de rede, Manutenção preventiva" 
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
                            placeholder="Ex: Upgrade de memória RAM, Backup dos dados, Troca de HD" 
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Camera className="h-4 w-4 inline mr-2" />
                        Fotos do Atendimento
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Fotos selecionadas:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Salvando..." : (editingNote ? "Atualizar" : "Criar")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}