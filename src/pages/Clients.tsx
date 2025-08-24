import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ClientForm from '@/components/ClientForm';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  document?: string | null;
  active: boolean;
  created_at: string;
}

const Clients = () => {
  const { user, profile, company, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const canManageClients = profile?.role === 'master';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (company && profile) {
      loadClients();
    }
  }, [company, profile]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company?.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar clientes',
        variant: 'destructive'
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ active: false })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cliente removido com sucesso!'
      });

      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover cliente',
        variant: 'destructive'
      });
    }
  };

  const handleFormSuccess = () => {
    setShowClientForm(false);
    setEditingClient(null);
    loadClients();
  };

  const handleFormCancel = () => {
    setShowClientForm(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingClients) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Clientes</h1>
              <p className="text-muted-foreground">Gerencie o cadastro de clientes</p>
            </div>
          </div>
          
          {canManageClients && (
            <Button onClick={() => setShowClientForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company_name && (
                      <CardDescription className="mt-1">
                        {client.company_name}
                      </CardDescription>
                    )}
                  </div>
                  
                  {canManageClients && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
                {client.email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email:</span> {client.email}
                  </div>
                )}
                
                {client.phone && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Telefone:</span> {client.phone}
                  </div>
                )}
                
                {client.document && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">CPF/CNPJ:</span> {client.document}
                  </div>
                )}
                
                {client.address && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Endereço:</span> {client.address}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Nenhum cliente encontrado para sua busca.' : 'Nenhum cliente cadastrado ainda.'}
            </p>
            {canManageClients && !searchTerm && (
              <Button onClick={() => setShowClientForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Cliente
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      {showClientForm && (
        <ClientForm
          client={editingClient}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default Clients;