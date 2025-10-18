# Sistema de Gerenciamento de Tickets

Sistema completo de gerenciamento de tickets para suporte técnico, com gestão de clientes, equipes, relatórios e notificações em tempo real.

## 🚀 Funcionalidades

### Gestão de Tickets
- ✅ Criação e edição de tickets com categorias personalizadas
- ✅ Sistema de prioridades e status
- ✅ Atribuição de tickets para técnicos
- ✅ Comentários e histórico completo de alterações
- ✅ Compartilhamento de tickets via link público
- ✅ Exportação de tickets para PDF
- ✅ Notas técnicas privadas para equipe interna

### Gestão de Clientes
- ✅ Cadastro completo de clientes
- ✅ Associação de tickets a clientes
- ✅ Histórico de atendimentos por cliente

### Gestão de Usuários e Equipes
- ✅ Sistema de autenticação seguro
- ✅ Níveis de permissão (Super Admin, Admin, Técnico, Cliente)
- ✅ Gerenciamento de equipes por empresa
- ✅ Promoção de usuários a Super Admin

### Notificações
- ✅ Notificações por e-mail em tempo real
- ✅ Alertas para novos tickets, mudanças de status e comentários
- ✅ Templates personalizados de e-mail

### Relatórios e Dashboard
- ✅ Dashboard com estatísticas em tempo real
- ✅ Relatórios detalhados de desempenho
- ✅ Gráficos de tickets por status, prioridade e categoria

### Personalização
- ✅ Campos personalizados para tickets
- ✅ Categorias customizáveis
- ✅ Temas por empresa

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes UI
- **React Router** - Navegação
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **TanStack Query** - Gerenciamento de estado assíncrono
- **Lucide React** - Ícones
- **jsPDF** - Geração de PDFs

### Backend (Lovable Cloud - Supabase)
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **Row Level Security (RLS)** - Segurança de dados
- **Edge Functions** - Funções serverless
- **Realtime** - Notificações em tempo real
- **Resend** - Envio de e-mails

## 📦 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes UI base (shadcn)
│   ├── ClientForm.tsx
│   ├── TicketForm.tsx
│   ├── UserForm.tsx
│   └── ...
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Tickets.tsx
│   ├── Clients.tsx
│   ├── UserManagement.tsx
│   └── ...
├── contexts/           # Contextos React
│   └── AuthContext.tsx
├── hooks/              # Custom hooks
│   └── useNotificationHandler.ts
├── utils/              # Utilitários
│   └── pdfExport.ts
└── integrations/       # Integrações externas
    └── supabase/
```

## 🔧 Como Usar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

There are several ways of editing your application.

### Via Lovable
Acesse o [Projeto Lovable](https://lovable.dev/projects/561895d5-514e-46f7-b764-084feb7684f1) e comece a fazer alterações via prompts de IA.

Alterações feitas no Lovable são automaticamente commitadas neste repositório.

### Via IDE Local
Clone este repositório e faça alterações localmente. As alterações enviadas via push serão refletidas no Lovable.

Requisito: Node.js & npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Clone o repositório
git clone <YOUR_GIT_URL>

# Entre no diretório
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env com as credenciais do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080`

## 🔐 Configuração do Backend

Este projeto usa **Lovable Cloud** (Supabase) para o backend. As principais configurações incluem:

### Tabelas do Banco de Dados
- `companies` - Empresas
- `profiles` - Perfis de usuários
- `clients` - Clientes
- `categories` - Categorias de tickets
- `tickets` - Tickets de suporte
- `ticket_comments` - Comentários em tickets
- `ticket_history` - Histórico de alterações
- `technical_notes` - Notas técnicas
- `custom_fields` - Campos personalizados

### Edge Functions
- `send-notification-email` - Envio de e-mails de notificação
- `create-user` - Criação de novos usuários
- `manage-user` - Gerenciamento de usuários
- `create-payment` - Processamento de pagamentos

### Segurança
- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso baseadas em empresa e perfil do usuário
- Autenticação via Supabase Auth

## 👥 Níveis de Acesso

1. **Super Admin** - Acesso total ao sistema
2. **Admin** - Gerencia empresa, usuários e tickets
3. **Técnico** - Atende tickets e adiciona notas técnicas
4. **Cliente** - Visualiza e comenta seus próprios tickets

## 📧 Sistema de Notificações

O sistema envia e-mails automáticos para:
- Criação de novos tickets
- Mudanças de status
- Atribuição de tickets
- Novos comentários

## 🎨 Personalização

O sistema permite personalização através de:
- Campos customizados para tickets
- Categorias personalizadas
- Configurações por empresa

## 📄 Exportação

- Exportação de tickets individuais para PDF
- Relatórios detalhados exportáveis

## 🔗 Links Úteis

**URL do Projeto**: https://lovable.dev/projects/561895d5-514e-46f7-b764-084feb7684f1

## 📝 Editando o Código

### Editar Diretamente no GitHub
- Navegue até o arquivo desejado
- Clique no botão "Edit" (ícone de lápis)
- Faça suas alterações e commit

### Usar GitHub Codespaces
- Vá para a página principal do repositório
- Clique no botão "Code" (verde)
- Selecione a aba "Codespaces"
- Clique em "New codespace"
- Edite os arquivos e faça commit das alterações

## 🚀 Deploy

Abra o [Lovable](https://lovable.dev/projects/561895d5-514e-46f7-b764-084feb7684f1) e clique em Share → Publish.

## 🌐 Domínio Personalizado

Para conectar um domínio personalizado:
1. Navegue até Project > Settings > Domains
2. Clique em Connect Domain
3. Siga as instruções para configurar o DNS

[Mais informações sobre domínios personalizados](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 📚 Documentação

- [Documentação Lovable](https://docs.lovable.dev/)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação React](https://react.dev/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto foi desenvolvido com [Lovable](https://lovable.dev)

---

**Desenvolvido com ❤️ usando Lovable**
