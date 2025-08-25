import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Users, 
  Building2, 
  Shield, 
  BarChart3, 
  Settings,
  Check,
  Star
} from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-hero rounded-3xl mb-8 sm:mb-10 shadow-2xl shadow-primary/25 animate-scale-in">
            <Ticket className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight animate-fade-in">
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              TicketFlow
            </span>
            <span className="block text-foreground mt-2">Sistema Multiempresa</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-4xl mx-auto px-4 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            A plataforma completa para gestão de chamados com controle de acesso por empresa, 
            relatórios avançados e personalização total.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              className="text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 w-full sm:w-auto bg-gradient-hero hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25"
              onClick={() => navigate('/auth')}
            >
              Começar Gratuitamente
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-8 w-full sm:w-auto border-2 hover:scale-105 transition-all duration-300"
            >
              Ver Demonstração
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-muted-foreground text-base sm:text-lg animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center space-x-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield className="w-5 h-5 text-primary" />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center space-x-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <Users className="w-5 h-5 text-primary" />
              <span>Multiempresa</span>
            </div>
            <div className="flex items-center space-x-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 animate-fade-in">
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Funcionalidades
              </span>
              <span className="block text-foreground">Poderosas</span>
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground px-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Tudo que sua empresa precisa para revolucionar a gestão de chamados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Multiempresa</CardTitle>
                <CardDescription className="text-base">
                  Isolamento completo entre empresas com dashboards personalizadas e controle total de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Isolamento total de dados</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Planos flexíveis por empresa</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Controle de usuários</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Gestão de Usuários</CardTitle>
                <CardDescription className="text-base">
                  Sistema hierárquico com três níveis: Master, Técnico e Cliente, cada um com permissões específicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Permissões granulares</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Gestão completa</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Ativação dinâmica</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Ticket className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Sistema de Chamados</CardTitle>
                <CardDescription className="text-base">
                  Plataforma completa para gestão de tickets com rastreamento em tempo real e histórico detalhado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Categorização inteligente</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Prioridades dinâmicas</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Histórico completo</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Campos Personalizados</CardTitle>
                <CardDescription className="text-base">
                  Adapte formulários às necessidades específicas de cada empresa com campos totalmente customizáveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-primary-glow/20 text-primary border-primary/30">Premium</Badge>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Campos únicos por empresa</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Tipos variados</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Relatórios Avançados</CardTitle>
                <CardDescription className="text-base">
                  Analytics detalhados com métricas de performance, produtividade e insights estratégicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Dashboards em tempo real</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">SLA e tempo resposta</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Análise por equipe</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Segurança Avançada</CardTitle>
                <CardDescription className="text-base">
                  Arquitetura robusta com controle de acesso granular e conformidade total de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">RLS nativo</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Criptografia end-to-end</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm font-medium">Auditoria completa</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-subtle relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center">
          <Card className="border-0 bg-gradient-card shadow-2xl shadow-primary/10 animate-fade-in">
            <CardHeader className="pb-8 sm:pb-10 pt-12 sm:pt-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-2xl mx-auto mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Transforme
                </span>
                <span className="block text-foreground">Sua Gestão Hoje</span>
              </CardTitle>
              <CardDescription className="text-xl sm:text-2xl px-4 max-w-3xl mx-auto leading-relaxed">
                Junte-se a empresas que revolucionaram sua gestão de chamados. 
                <span className="block mt-2 font-semibold text-primary">Configure em minutos, veja resultados hoje.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-12 sm:pb-16">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8">
                <Button 
                  size="lg" 
                  className="text-xl px-10 py-8 w-full sm:w-auto bg-gradient-hero hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25"
                  onClick={() => navigate('/auth')}
                >
                  Começar Gratuitamente
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-xl px-10 py-8 w-full sm:w-auto border-2 hover:scale-105 transition-all duration-300"
                >
                  Agendar Demo
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Suporte premium incluído</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
