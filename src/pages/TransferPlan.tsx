import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Users, Database, Globe, CreditCard, Mail, Shield, FileText, Settings } from "lucide-react";

const TransferPlan = () => {
  const phases = [
    {
      id: 1,
      title: "Preparação e Documentação",
      duration: "1-2 dias",
      icon: <FileText className="h-5 w-5" />,
      status: "pending",
      tasks: [
        "Criar documentação técnica completa do sistema",
        "Preparar scripts de migração do banco de dados",
        "Documentar todas as integrações e configurações",
        "Criar guia de instalação para o comprador",
        "Preparar checklist de transferência"
      ]
    },
    {
      id: 2,
      title: "Setup do Novo Ambiente",
      duration: "1 dia",
      icon: <Settings className="h-5 w-5" />,
      status: "pending",
      tasks: [
        "Comprador cria conta Supabase",
        "Comprador cria conta Stripe",
        "Comprador cria conta Resend",
        "Criar novo projeto Lovable ou ambiente de desenvolvimento",
        "Configurar repositório GitHub (se necessário)"
      ]
    },
    {
      id: 3,
      title: "Migração do Backend",
      duration: "2-3 dias",
      icon: <Database className="h-5 w-5" />,
      status: "pending",
      tasks: [
        "Criar novo projeto Supabase",
        "Executar migração completa do esquema",
        "Migrar dados existentes (se aplicável)",
        "Configurar todas as Edge Functions",
        "Configurar Storage buckets e políticas",
        "Configurar RLS policies",
        "Testar todas as funcionalidades do backend"
      ]
    },
    {
      id: 4,
      title: "Configuração do Frontend",
      duration: "1 dia",
      icon: <Globe className="h-5 w-5" />,
      status: "pending",
      tasks: [
        "Atualizar configurações de conexão Supabase",
        "Configurar domínio personalizado",
        "Testar integração completa",
        "Configurar variáveis de ambiente",
        "Deploy final e testes de produção"
      ]
    },
    {
      id: 5,
      title: "Treinamento e Suporte",
      duration: "1-2 dias",
      icon: <Users className="h-5 w-5" />,
      status: "pending",
      tasks: [
        "Treinamento para uso do sistema",
        "Documentação administrativa",
        "Transferência de conhecimento técnico",
        "Suporte pós-transferência (30 dias)",
        "Validação final do sistema"
      ]
    }
  ];

  const secrets = [
    { name: "SUPABASE_URL", description: "URL do projeto Supabase" },
    { name: "SUPABASE_ANON_KEY", description: "Chave pública do Supabase" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Chave de serviço do Supabase" },
    { name: "STRIPE_SECRET_KEY", description: "Chave secreta do Stripe" },
    { name: "RESEND_API_KEY", description: "Chave da API do Resend" },
    { name: "SUPABASE_DB_URL", description: "URL de conexão direta com o banco" },
    { name: "SUPABASE_PUBLISHABLE_KEY", description: "Chave publicável do Supabase" }
  ];

  const costs = [
    { service: "Supabase Pro", cost: "$25/mês", description: "Banco de dados e backend" },
    { service: "Stripe", cost: "2.9% + $0.30 por transação", description: "Processamento de pagamentos" },
    { service: "Resend", cost: "$20/mês", description: "Envio de emails (até 100k emails)" },
    { service: "Domínio", cost: "$10-50/ano", description: "Domínio personalizado" },
    { service: "Lovable Pro (opcional)", cost: "$20/mês", description: "Hospedagem e edição visual" }
  ];

  const features = [
    "Sistema completo de tickets e suporte",
    "Autenticação multiusuário com RLS",
    "Dashboard administrativo completo",
    "Notas técnicas integradas",
    "Sistema de notificações por email",
    "Integração com Stripe para pagamentos",
    "Exportação de relatórios em PDF",
    "Sistema de comentários e histórico",
    "Gerenciamento de clientes e categorias",
    "Campos personalizados configuráveis",
    "Compartilhamento seguro de tickets",
    "Interface responsiva e moderna"
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Plano Detalhado de Transferência</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Processo completo para transferência do sistema de tickets e suporte
        </p>
      </div>

      {/* Visão Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Visão Geral do Sistema
          </CardTitle>
          <CardDescription>
            Sistema completo de gestão de tickets e suporte ao cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fases da Transferência */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Fases da Transferência</h2>
        <div className="grid gap-6">
          {phases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {phase.icon}
                    <span>Fase {phase.id}: {phase.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {phase.duration}
                    </Badge>
                    <Badge variant={phase.status === "completed" ? "default" : "secondary"}>
                      {phase.status === "completed" ? "Concluída" : "Pendente"}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phase.tasks.map((task, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                      <span className="text-sm">{task}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configurações e Secrets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações Críticas
          </CardTitle>
          <CardDescription>
            Secrets e configurações que precisam ser reconfiguradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {secrets.map((secret, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {secret.name}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">{secret.description}</p>
                </div>
                <Badge variant="outline">Crítico</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custos Estimados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Custos Estimados para o Comprador
          </CardTitle>
          <CardDescription>
            Custos mensais/anuais para manter o sistema funcionando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costs.map((cost, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{cost.service}</h4>
                  <p className="text-sm text-muted-foreground">{cost.description}</p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {cost.cost}
                </Badge>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Custo Total Estimado:</h4>
            <p className="text-sm text-muted-foreground">
              • Mensal: ~$65-85/mês (dependendo do volume de transações e emails)
            </p>
            <p className="text-sm text-muted-foreground">
              • Anual: ~$800-1000/ano (incluindo domínio)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cronograma Total */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cronograma Total
          </CardTitle>
          <CardDescription>
            Tempo estimado para transferência completa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 border rounded-lg">
              <h3 className="text-2xl font-bold text-primary">6-9 dias</h3>
              <p className="text-sm text-muted-foreground">Duração total</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-2xl font-bold text-primary">5 fases</h3>
              <p className="text-sm text-muted-foreground">Etapas principais</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-2xl font-bold text-primary">30 dias</h3>
              <p className="text-sm text-muted-foreground">Suporte pós-transferência</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsabilidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Responsabilidades do Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Documentação completa do sistema</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Scripts de migração do banco</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Suporte durante a migração</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Treinamento técnico</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">30 dias de suporte pós-venda</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsabilidades do Comprador</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Criação das contas necessárias</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Configuração inicial dos serviços</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Aquisição de domínio (se necessário)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Testes e validação final</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Pagamento dos custos operacionais</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransferPlan;