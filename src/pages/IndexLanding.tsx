import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Ticket, BarChart3, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const IndexLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Sistema de <span className="text-primary">Tickets</span> Profissional
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gerencie tickets de suporte, organize sua equipe e acompanhe métricas em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth">
                Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/auth">
                Fazer Login
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Funcionalidades Principais</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Ticket className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Gestão de Tickets</CardTitle>
                <CardDescription>
                  Crie, atribua e acompanhe tickets de suporte com facilidade
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Equipe Organizada</CardTitle>
                <CardDescription>
                  Gerencie usuários, papéis e permissões de forma eficiente
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Relatórios Detalhados</CardTitle>
                <CardDescription>
                  Acompanhe métricas e gere relatórios em tempo real
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Rápido e Eficiente</CardTitle>
                <CardDescription>
                  Interface moderna e responsiva para máxima produtividade
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Administrativo</h2>
          <p className="text-muted-foreground mb-6">
            Área restrita para configuração do sistema
          </p>
          <Button asChild variant="outline">
            <Link to="/create-super-admin">
              <Shield className="w-4 h-4 mr-2" />
              Área Admin
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default IndexLanding;