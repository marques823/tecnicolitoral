import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Crown, Star, Building } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  type: string;
  max_users: number;
  has_custom_fields: boolean;
  monthly_price: number;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; plan: Plan | null }>({
    open: false,
    plan: null
  });
  const { toast } = useToast();
  const { profile, company } = useAuth();

  const canManagePlans = profile?.role === 'master';

  useEffect(() => {
    loadPlans();
    loadCurrentPlan();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('monthly_price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    }
  };

  const loadCurrentPlan = async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          plans (*)
        `)
        .eq('id', company.id)
        .single();

      if (error) throw error;
      setCurrentPlan((data as any)?.plans || null);
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (plan: Plan) => {
    if (!company?.id || !canManagePlans) return;

    setUpgrading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ plan_id: plan.id })
        .eq('id', company.id);

      if (error) throw error;

      setCurrentPlan(plan);
      setConfirmDialog({ open: false, plan: null });
      
      toast({
        title: "Sucesso",
        description: `Plano alterado para ${plan.name} com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar plano",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'basic':
        return <Building className="w-6 h-6" />;
      case 'professional':
        return <Star className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Building className="w-6 h-6" />;
    }
  };

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'basic':
        return 'border-blue-200 bg-blue-50';
      case 'professional':
        return 'border-purple-200 bg-purple-50';
      case 'enterprise':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!canManagePlans) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Crown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Apenas usuários master podem gerenciar planos.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Carregando planos...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planos</h1>
        <p className="text-muted-foreground">
          Gerencie o plano da sua empresa
        </p>
      </div>

      {currentPlan && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-primary">
                  {getPlanIcon(currentPlan.type)}
                </div>
                <div>
                  <CardTitle className="text-primary">Plano Atual</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan.name}
                  </p>
                </div>
              </div>
              <Badge variant="default">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Usuários</p>
                <p className="text-2xl font-bold">{currentPlan.max_users}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Campos Personalizados</p>
                <p className="text-2xl font-bold">
                  {currentPlan.has_custom_fields ? 'Sim' : 'Não'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Preço Mensal</p>
                <p className="text-2xl font-bold">
                  {formatPrice(currentPlan.monthly_price)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${getPlanColor(plan.type)} ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-primary">
                      <Check className="w-3 h-3 mr-1" />
                      Plano Atual
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.type)}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(plan.monthly_price)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Até {plan.max_users} usuários</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Tickets ilimitados</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Relatórios básicos</span>
                    </div>
                    {plan.has_custom_fields && (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Campos personalizados</span>
                      </div>
                    )}
                  </div>
                  
                  {!isCurrentPlan && (
                    <Button
                      className="w-full"
                      onClick={() => setConfirmDialog({ open: true, plan })}
                      disabled={upgrading}
                    >
                      {plan.monthly_price > (currentPlan?.monthly_price || 0) 
                        ? 'Fazer Upgrade' 
                        : 'Alterar Plano'
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ open, plan: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração de Plano</DialogTitle>
          </DialogHeader>
          
          {confirmDialog.plan && (
            <div className="space-y-4">
              <p>
                Tem certeza que deseja alterar para o plano{' '}
                <strong>{confirmDialog.plan.name}</strong>?
              </p>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Usuários</p>
                  <p>{confirmDialog.plan.max_users}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Preço Mensal</p>
                  <p>{formatPrice(confirmDialog.plan.monthly_price)}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialog({ open: false, plan: null })}
                  disabled={upgrading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleUpgradePlan(confirmDialog.plan!)}
                  disabled={upgrading}
                >
                  {upgrading ? 'Alterando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}