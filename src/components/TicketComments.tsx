import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { MessageSquare, Lock, Eye, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

interface TicketCommentsProps {
  ticketId: string;
  canAddComments: boolean;
}

const TicketComments = ({ ticketId, canAddComments }: TicketCommentsProps) => {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile, company } = useAuth();

  const loadComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos usuários separadamente (usando função segura)
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .rpc('get_basic_profiles', { target_company_id: company?.id })
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.name]) || []);

      const formattedComments = commentsData?.map(comment => ({
        ...comment,
        user_name: profilesMap.get(comment.user_id) || 'Usuário'
      })) || [];

      setComments(formattedComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar comentários do ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !profile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: profile.user_id,
          comment: newComment.trim(),
          is_private: isPrivate
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: isPrivate ? "Comentário privado adicionado" : "Comentário adicionado",
      });

      setNewComment('');
      setIsPrivate(false);
      loadComments();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  if (loading) {
    return <div className="p-4 text-center">Carregando comentários...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comentários e Observações</h3>
        <Badge variant="secondary">{comments.length}</Badge>
      </div>

      {/* Lista de comentários */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              {canAddComments ? "Nenhum comentário ainda. Seja o primeiro a comentar!" : "Nenhum comentário ainda."}
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    {comment.is_private && canAddComments && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Privado
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Formulário para novo comentário */}
      {canAddComments && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Textarea
              placeholder="Escreva seu comentário ou observação aqui..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="private-comment"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private-comment" className="text-sm">
                  Comentário privado
                </Label>
              </div>
              
              <Button 
                onClick={addComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketComments;