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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-8">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Sistema de Chamados
            <span className="block text-primary">Multiempresa</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Gerencie tickets, usuários e empresas em uma plataforma completa. 
            Controle de acesso por níveis, relatórios avançados e campos personalizados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
            >
              Saiba Mais
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-8 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Multiusuário</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Relatórios</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Funcionalidades Principais</h2>
            <p className="text-xl text-muted-foreground">
              Tudo que você precisa para gerenciar chamados eficientemente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Building2 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Multiempresa</CardTitle>
                <CardDescription>
                  Cada empresa tem sua própria dashboard isolada com controle total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Isolamento completo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Planos flexíveis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Limite de usuários</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>
                  Três níveis de acesso: Master, Técnico e Cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Controle de permissões</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">CRUD completo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Ativação/desativação</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Ticket className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Sistema de Chamados</CardTitle>
                <CardDescription>
                  Gerenciamento completo de tickets com histórico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Categorização</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Níveis de prioridade</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Histórico completo</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Campos Personalizados</CardTitle>
                <CardDescription>
                  Customize formulários conforme suas necessidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="outline">Premium</Badge>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Campos específicos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Por empresa</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Relatórios Avançados</CardTitle>
                <CardDescription>
                  Analytics completos de performance e produtividade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Relatórios mensais</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Tempo de resolução</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Por usuário/empresa</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Segurança Avançada</CardTitle>
                <CardDescription>
                  Controle de acesso robusto e auditoria completa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">RLS (Row Level Security)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Autenticação segura</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">Logs de auditoria</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card>
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-bold mb-4">
                Pronto para começar?
              </CardTitle>
              <CardDescription className="text-lg">
                Crie sua conta agora e comece a gerenciar chamados de forma profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                Começar Gratuitamente
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Teste grátis • Sem cartão de crédito • Suporte incluído
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
