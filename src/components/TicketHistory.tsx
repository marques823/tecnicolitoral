import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText, MessageCircle, Lock, Eye } from "lucide-react";

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  user_id: string;
}

interface TicketComment {
  id: string;
  comment: string;
  is_private: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    name: string;
    role: string;
  };
}

interface TicketHistoryProps {
  ticketId: string;
}

export default function TicketHistory({ ticketId }: TicketHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryAndComments();
  }, [ticketId]);

  const loadHistoryAndComments = async () => {
    try {
      // Carregar histórico
      const { data: historyData, error: historyError } = await supabase
        .from("ticket_history")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      // Carregar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;
      if (commentsError) throw commentsError;

      // Buscar perfis dos usuários que fizeram comentários
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, role")
          .in("user_id", userIds);
        profilesData = profiles || [];
      }

      // Combinar comentários com perfis
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData.find(p => p.user_id === comment.user_id)
      })) || [];

      setHistory(historyData || []);
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      status_change: { variant: "default", label: "Status" },
      priority_change: { variant: "secondary", label: "Prioridade" },
      assignment_change: { variant: "outline", label: "Atribuição" },
      resolved: { variant: "default", label: "Resolvido" },
      created: { variant: "secondary", label: "Criado" },
      comment_added: { variant: "default", label: "Comentário" },
      comment_updated: { variant: "outline", label: "Comentário Editado" },
    };

    const config = variants[action] || { variant: "outline" as const, label: action };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Combinar histórico e comentários ordenados por data
  const allEntries = [
    ...history.map(entry => ({ ...entry, type: 'history' as const })),
    ...comments.map(comment => ({ ...comment, type: 'comment' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return <div className="text-center py-4">Carregando histórico...</div>;
  }

  if (allEntries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum histórico ou comentário disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Histórico e Comentários
        <Badge variant="secondary">{allEntries.length}</Badge>
      </h3>
      
      <div className="space-y-3">
        {allEntries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {entry.type === 'history' ? (
                    getActionBadge((entry as HistoryEntry).action)
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      Comentário
                    </Badge>
                  )}
                  
                  {entry.type === 'comment' && (entry as TicketComment).is_private && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Privado
                    </Badge>
                  )}
                  
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {entry.type === 'comment' ? 
                    (entry as TicketComment).profiles?.name || 'Usuário' : 
                    entry.user_id
                  }
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {entry.type === 'history' ? (
                <>
                  <p className="text-sm">{(entry as HistoryEntry).description}</p>
                  {(entry as HistoryEntry).old_value && (entry as HistoryEntry).new_value && (
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">De: </span>
                      <code className="bg-muted px-1 py-0.5 rounded">{(entry as HistoryEntry).old_value}</code>
                      <span className="text-muted-foreground"> → Para: </span>
                      <code className="bg-muted px-1 py-0.5 rounded">{(entry as HistoryEntry).new_value}</code>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-muted/50 p-3 rounded border-l-4 border-primary/20">
                  <p className="text-sm whitespace-pre-wrap">{(entry as TicketComment).comment}</p>
                  {(entry as TicketComment).profiles?.role && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {(entry as TicketComment).profiles?.role === 'company_admin' ? 'Administrador' :
                         (entry as TicketComment).profiles?.role === 'technician' ? 'Técnico' :
                         (entry as TicketComment).profiles?.role === 'client_user' ? 'Cliente' : 
                         (entry as TicketComment).profiles?.role}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}