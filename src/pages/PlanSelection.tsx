import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Star, Building, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  type: string;
  max_users: number;
  has_custom_fields: boolean;
  monthly_price: number;
}

export default function PlanSelection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se já tem empresa, redireciona para dashboard
    if (profile?.company_id) {
      navigate('/dashboard');
      return;
    }
    
    loadPlans();
  }, [profile, navigate]);

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
    } finally {
      setLoading(false);
    }
  };

  const createCompanyAndProfile = async (plan: Plan) => {
    if (!user) return;

    setCreating(true);
    try {
      // Criar empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: `Empresa de ${user.user_metadata?.name || user.email}`,
          plan_id: plan.id,
          active: true
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Criar perfil do usuário como master
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          company_id: companyData.id,
          name: user.user_metadata?.name || user.email,
          role: 'master',
          active: true
        });

      if (profileError) throw profileError;

      toast({
        title: "Sucesso!",
        description: `Sua empresa foi criada com o plano ${plan.name}`,
      });

      // Aguarda um pouco para garantir que o contexto seja atualizado
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar empresa",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'basic':
        return <Building className="w-8 h-8" />;
      case 'premium':
        return <Star className="w-8 h-8" />;
      case 'enterprise':
        return <Crown className="w-8 h-8" />;
      default:
        return <Building className="w-8 h-8" />;
    }
  };

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'basic':
        return 'border-blue-200 hover:border-blue-300';
      case 'premium':
        return 'border-purple-200 hover:border-purple-300 relative';
      case 'enterprise':
        return 'border-yellow-200 hover:border-yellow-300';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  const formatPrice = (price: number, annual: boolean = false) => {
    const finalPrice = annual ? price * 12 * 0.8 : price; // 20% de desconto no anual
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(finalPrice);
  };

  const getAnnualSavings = (price: number) => {
    const monthlyCost = price * 12;
    const annualCost = price * 12 * 0.8;
    const savings = monthlyCost - annualCost;
    return formatPrice(savings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Escolha seu plano</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano que melhor atende às necessidades da sua empresa
          </p>
          
          {/* Toggle Anual/Mensal */}
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Label htmlFor="billing-toggle" className={!isAnnual ? 'text-foreground' : 'text-muted-foreground'}>
              Mensal
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? 'text-foreground' : 'text-muted-foreground'}>
              Anual
            </Label>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                20% de desconto
              </Badge>
            )}
          </div>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Plano do meio é popular
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 ${getPlanColor(plan.type)} ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
                } ${isPopular ? 'scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center space-y-4">
                  <div className="flex justify-center text-primary">
                    {getPlanIcon(plan.type)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {formatPrice(plan.monthly_price, isAnnual)}
                      <span className="text-lg font-normal text-muted-foreground">
                        /{isAnnual ? 'ano' : 'mês'}
                      </span>
                    </div>
                    
                    {isAnnual && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(plan.monthly_price * 12)} por ano
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                          Economia de {getAnnualSavings(plan.monthly_price)} por ano
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Até {plan.max_users} usuários</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Tickets ilimitados</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Suporte por email</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Relatórios básicos</span>
                    </div>
                    {plan.has_custom_fields && (
                      <>
                        <div className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Campos personalizados</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Relatórios avançados</span>
                        </div>
                      </>
                    )}
                    {plan.type === 'enterprise' && (
                      <>
                        <div className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>Suporte prioritário</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>API personalizada</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button
                    className="w-full"
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => createCompanyAndProfile(plan)}
                    disabled={creating}
                  >
                    {creating ? (
                      'Criando...'
                    ) : (
                      <>
                        Começar com {plan.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Garantia */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            🔒 Pagamento seguro • 30 dias de garantia • Cancele a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}