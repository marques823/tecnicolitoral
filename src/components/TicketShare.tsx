import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Share2, Copy, Clock } from "lucide-react";

interface TicketShareProps {
  ticketId: string;
}

export default function TicketShare({ ticketId }: TicketShareProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      // Gerar token de compartilhamento
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_share_token');

      if (tokenError) throw tokenError;

      const shareToken = tokenData;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Criar registro de compartilhamento
      const { error } = await supabase
        .from("ticket_shares")
        .insert({
          ticket_id: ticketId,
          share_token: shareToken,
          expires_at: expiresAt.toISOString(),
          password_hash: password ? btoa(password) : null, // Simples base64, em produção usar hash apropriado
          shared_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      const url = `${window.location.origin}/shared/ticket/${shareToken}`;
      setShareUrl(url);
      toast.success("Link de compartilhamento gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar link:", error);
      toast.error("Erro ao gerar link de compartilhamento");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Ticket</DialogTitle>
          <DialogDescription>
            Gere um link seguro para compartilhar este ticket com pessoas externas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expires">Expira em (dias)</Label>
            <Input
              id="expires"
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 1)}
              min={1}
              max={30}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha (opcional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Deixe em branco para acesso livre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={generateShareLink} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Gerando..." : "Gerar Link"}
          </Button>
          
          {shareUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Link de Compartilhamento</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expira em {expiresInDays} {expiresInDays === 1 ? 'dia' : 'dias'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  <Button size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {password && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Este link está protegido por senha
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}