import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2, Building2, Ticket } from 'lucide-react';
import { validateCNPJ, formatCNPJ } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Se o usuário já tem perfil e empresa, vai para dashboard
      // Senão, vai para seleção de planos
      navigate('/plan-selection');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar CNPJ
    if (!validateCNPJ(cnpj)) {
      toast({
        title: "CNPJ inválido",
        description: "Por favor, digite um CNPJ válido",
        variant: "destructive",
      });
      return;
    }
    
    // Validar se todos os campos estão preenchidos
    if (!name.trim() || !companyName.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await signUp(email, password, name, companyName, cnpj);
    } catch (error) {
      console.error('Erro no cadastro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCNPJ(value);
    if (formatted.length <= 18) { // Limita o tamanho máximo
      setCnpj(formatted);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">TicketFlow</h1>
            <p className="text-muted-foreground text-sm">Acesse sua conta</p>
          </div>
        </div>

        {/* Formulário de Login/Cadastro */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar Empresa</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Nome da Empresa</Label>
                    <Input
                      id="signup-company"
                      type="text"
                      placeholder="Razão social da empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-cnpj">CNPJ</Label>
                    <Input
                      id="signup-cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={handleCnpjChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome do Responsável</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Nome completo do responsável"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar Empresa
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Cadastro exclusivo para empresas com CNPJ válido
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;