import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, FileText, Share, Edit, Trash2, Download } from "lucide-react";
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
}

const noteSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  tags: z.string().optional(),
  is_public: z.boolean().default(false),
  ticket_id: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

export default function TechnicalNotes() {
  const { profile, company } = useAuth();
  const [notes, setNotes] = useState<TechnicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TechnicalNote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      is_public: false,
      ticket_id: "",
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

  const handleSaveNote = async (data: NoteFormData) => {
    try {
      const tags = data.tags ? data.tags.split(",").map(tag => tag.trim()) : [];
      
      if (editingNote) {
        const { error } = await supabase
          .from("technical_notes")
          .update({
            title: data.title,
            content: data.content,
            tags,
            is_public: data.is_public,
            ticket_id: data.ticket_id || null,
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        toast.success("Nota técnica atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("technical_notes")
          .insert({
            title: data.title,
            content: data.content,
            tags,
            is_public: data.is_public,
            ticket_id: data.ticket_id || null,
            company_id: company!.id,
            created_by: profile!.user_id,
          });

        if (error) throw error;
        toast.success("Nota técnica criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingNote(null);
      form.reset();
      loadNotes();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      toast.error("Erro ao salvar nota técnica");
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
    });
    setIsDialogOpen(true);
  };

  const exportToPDF = (note: TechnicalNote) => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text(note.title, 20, 30);
    
    // Data
    doc.setFontSize(12);
    doc.text(`Data: ${new Date(note.created_at).toLocaleDateString('pt-BR')}`, 20, 45);
    
    // Tags
    if (note.tags?.length > 0) {
      doc.text(`Tags: ${note.tags.join(', ')}`, 20, 55);
    }
    
    // Conteúdo
    doc.setFontSize(10);
    const splitContent = doc.splitTextToSize(note.content, 170);
    doc.text(splitContent, 20, 70);
    
    doc.save(`nota-tecnica-${note.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notas Técnicas</h1>
          <p className="text-muted-foreground">
            Gerencie suas notas técnicas e compartilhe conhecimento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingNote(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? "Editar Nota Técnica" : "Nova Nota Técnica"}
              </DialogTitle>
              <DialogDescription>
                Crie ou edite uma nota técnica para compartilhar conhecimento
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveNote)} className="space-y-4">
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
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Conteúdo da nota técnica" 
                          className="min-h-[200px]"
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
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingNote ? "Atualizar" : "Criar"} Nota
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {note.title}
                    {note.is_public && (
                      <Badge variant="secondary">Pública</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Criado em {new Date(note.created_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
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
                  {(profile?.role === 'master' || note.created_by === profile?.user_id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                {note.content}
              </p>
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