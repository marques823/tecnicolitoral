import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ShareTicket() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('24');
  const [requirePassword, setRequirePassword] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, description')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar ticket',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    if (!ticketId) return;

    setLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

      // First generate a share token
      const shareToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('ticket_shares')
        .insert([{
          ticket_id: ticketId,
          shared_by: (await supabase.auth.getUser()).data.user?.id || '',
          expires_at: expiresAt.toISOString(),
          password_hash: requirePassword && password ? await hashPassword(password) : null,
          share_token: shareToken
        }])
        .select('share_token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/shared-ticket/${data.share_token}`;
      setShareLink(link);

      toast({
        title: 'Sucesso',
        description: 'Link de compartilhamento criado com sucesso!'
      });
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar link de compartilhamento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Copiado!',
      description: 'Link copiado para a área de transferência'
    });
  };

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(`/tickets/${ticketId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Compartilhar Ticket</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share className="w-5 h-5" />
            <span>Compartilhar Ticket: {ticket.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!shareLink ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiresIn">Expira em (horas)</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  min="1"
                  max="168"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requirePassword"
                  checked={requirePassword}
                  onCheckedChange={(checked) => setRequirePassword(checked as boolean)}
                />
                <Label htmlFor="requirePassword">Proteger com senha</Label>
              </div>

              {requirePassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite uma senha"
                  />
                </div>
              )}

              <Button 
                onClick={handleShare} 
                disabled={loading || (requirePassword && !password)}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Link de Compartilhamento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link de Compartilhamento</Label>
                <div className="flex space-x-2">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Button onClick={copyToClipboard} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Este link permite acesso somente leitura ao ticket e expira em {expiresIn} horas.
                  {requirePassword && ' O link está protegido por senha.'}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => setShareLink('')} variant="outline">
                  Criar Novo Link
                </Button>
                <Button onClick={() => navigate(`/tickets/${ticketId}`)}>
                  Voltar ao Ticket
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}