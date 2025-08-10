import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function PaymentCanceled() {
  useEffect(() => {
    document.title = 'Pagamento cancelado - TicketFlow';
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Pagamento cancelado</h1>
        <p className="text-muted-foreground">Você pode tentar novamente quando quiser.</p>
        <Link className="underline" to="/plan-selection">Voltar para seleção de planos</Link>
      </div>
    </main>
  );
}
