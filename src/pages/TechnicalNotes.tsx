import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ticket_id: z.string().optional(),
  problem_description: z.string().optional(),
  solution_description: z.string().optional(),
  observations: z.string().optional(),
  equipment_models: z.string().optional(),
  services_performed: z.string().optional(),
  services_needed: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

export default function TechnicalNotes() {
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
      ticket_id: "",
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
      loadNotes();
    }
  }, [profile, company]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("technical_notes")
        .select("*")
        .eq("company_id", company!.id)
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
        ticket_id: data.ticket_id || null,
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
      ticket_id: note.ticket_id || "",
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
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Notas Técnicas</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Gerencie suas notas técnicas com informações detalhadas de serviços
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
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        name="ticket_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID do Ticket (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="ID do ticket relacionado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
                            Solução Aplicada
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
                            Equipamentos/Modelos (separados por vírgula)
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
                          <FormLabel className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Observações Adicionais
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações importantes, recomendações, etc." 
                              className="min-h-[80px]"
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
                              placeholder="Ex: Limpeza do equipamento, Troca de HD, Instalação de software"
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
                          <FormLabel>Serviços Pendentes/Necessários (separados por vírgula)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Backup dos dados, Atualização do sistema, Compra de cabo de rede"
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
                      <FormLabel className="flex items-center gap-2 mb-4">
                        <Camera className="h-4 w-4" />
                        Fotos do Serviço
                      </FormLabel>
                      
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="text-center">
                          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <div className="space-y-2">
                            <label className="cursor-pointer">
                              <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                <Plus className="h-4 w-4" />
                                Adicionar Fotos
                              </span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                            </label>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG até 10MB cada
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                    {uploading ? "Salvando..." : editingNote ? "Atualizar" : "Criar"} Nota
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full">
        <Input
          placeholder="Buscar notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="w-full">
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{note.title}</span>
                    {note.is_public && (
                      <Badge variant="secondary" className="flex-shrink-0">Pública</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Criado em {new Date(note.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToPDF(note)}
                    className="flex-1 lg:flex-none"
                  >
                    <Download className="h-4 w-4" />
                    <span className="ml-2 lg:hidden">Baixar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditNote(note)}
                    className="flex-1 lg:flex-none"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="ml-2 lg:hidden">Editar</span>
                  </Button>
                  {(profile?.role === 'master' || note.created_by === profile?.user_id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="flex-1 lg:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-2 lg:hidden">Excluir</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {note.problem_description && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4" />
                    Problema:
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.problem_description}
                  </p>
                </div>
              )}
              
              {note.solution_description && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4" />
                    Solução:
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.solution_description}
                  </p>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {note.content}
              </p>
              
              {note.equipment_models && note.equipment_models.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Monitor className="h-4 w-4" />
                    Equipamentos:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {note.equipment_models.map((model) => (
                      <Badge key={model} variant="outline" className="text-xs">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.services_performed && note.services_performed.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-green-600 mb-2">
                    ✓ Serviços Realizados:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {note.services_performed.map((service) => (
                      <Badge key={service} variant="default" className="text-xs bg-green-100 text-green-800">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.services_needed && note.services_needed.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-orange-600 mb-2">
                    ⚠ Serviços Pendentes:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {note.services_needed.map((service) => (
                      <Badge key={service} variant="default" className="text-xs bg-orange-100 text-orange-800">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.photos && note.photos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4" />
                    Fotos ({note.photos.length}):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {note.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={getPhotoUrl(photo)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(getPhotoUrl(photo), '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma nota encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente ajustar os filtros de busca." : "Comece criando sua primeira nota técnica."}
          </p>
        </div>
      )}
    </div>
  );
}