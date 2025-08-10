import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshAuthData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const finalize = async () => {
      const planId = params.get('plan_id');
      const annual = params.get('annual') === '1';
      if (!user || !planId) {
        navigate('/plan-selection');
        return;
      }
      try {
        const companyName = `Empresa de ${user.user_metadata?.name || user.email}`;
        const { error } = await supabase.rpc('create_company_and_profile', {
          company_name: companyName,
          plan_id: planId,
        });
        if (error) throw error;
        await refreshAuthData();
        toast({ title: 'Pagamento aprovado', description: 'Empresa criada com sucesso.' });
        navigate('/dashboard');
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message || 'Falha ao finalizar a criação', variant: 'destructive' });
        navigate('/plan-selection');
      }
    };
    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = 'Pagamento confirmado - TicketFlow';
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Finalizando sua configuração...</p>
    </main>
  );
}
