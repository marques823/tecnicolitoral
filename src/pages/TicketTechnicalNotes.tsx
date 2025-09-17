import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TechnicalNotesForTicket from '@/components/TechnicalNotesForTicket';

export default function TicketTechnicalNotes() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Verificar se o usuário tem permissão para acessar notas técnicas
  if (profile?.role === 'client_user') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar notas técnicas.
          </p>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para chamados
          </Button>
        </div>
      </div>
    );
  }

  if (!ticketId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ticket não encontrado</h2>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para chamados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <TechnicalNotesForTicket 
        ticketId={ticketId} 
        onClose={() => navigate(`/tickets/${ticketId}`)}
      />
    </div>
  );
}