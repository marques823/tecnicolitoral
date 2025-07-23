import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText } from "lucide-react";

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  user_id: string;
}

interface TicketHistoryProps {
  ticketId: string;
}

export default function TicketHistory({ ticketId }: TicketHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [ticketId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_history")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
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
    };

    const config = variants[action] || { variant: "outline" as const, label: action };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-4">Carregando histórico...</div>;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum histórico disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Histórico do Ticket
      </h3>
      
      <div className="space-y-3">
        {history.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getActionBadge(entry.action)}
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
                  {entry.user_id}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">{entry.description}</p>
              {entry.old_value && entry.new_value && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">De: </span>
                  <code className="bg-muted px-1 py-0.5 rounded">{entry.old_value}</code>
                  <span className="text-muted-foreground"> → Para: </span>
                  <code className="bg-muted px-1 py-0.5 rounded">{entry.new_value}</code>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}