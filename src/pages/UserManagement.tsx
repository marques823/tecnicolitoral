import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  MoreHorizontal,
  Mail,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserForm from '@/components/UserForm';
import UserDetailModal from '@/components/UserDetailModal';
import PasswordResetModal from '@/components/PasswordResetModal';
import EmailChangeModal from '@/components/EmailChangeModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  role: 'master' | 'technician' | 'client';
  active: boolean;
  created_at: string;
  user_email?: string;
}

interface Plan {
  id: string;
  name: string;
  max_users: number;
}

const UserManagement = () => {
  const { user, profile, company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);
  const [emailChangeUser, setEmailChangeUser] = useState<UserProfile | null>(null);

  // Verificar se o usuário é Master
  useEffect(() => {
    if (!user || !profile || profile.role !== 'master') {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  // Carregar usuários e plano
  useEffect(() => {
    if (company && profile?.role === 'master') {
      loadUsers();
      loadPlan();
    }
  }, [company, profile]);

  const loadUsers = async () => {
    try {
      // Usar edge function para buscar usuários com emails reais
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'get_users',
          company_id: company?.id
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setUsers(data.users);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          plans (
            id,
            name,
            max_users
          )
        `)
        .eq('id', company?.id)
        .single();

      if (error) throw error;
      setPlan(data?.plans as Plan);
    } catch (error: any) {
      console.error('Error loading plan:', error);
    }
  };

  const handleCreateUser = () => {
    // Verificar limite de usuários
    const activeUsers = users.filter(u => u.active).length;
    if (plan && activeUsers >= plan.max_users) {
      toast({
        title: "Limite de usuários atingido",
        description: `Seu plano permite no máximo ${plan.max_users} usuários ativos.`,
        variant: "destructive",
      });
      return;
    }

    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUserFormSuccess = () => {
    setShowUserForm(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleResetPassword = (user: UserProfile) => {
    setPasswordResetUser(user);
    setShowPasswordReset(true);
    setShowUserDetail(false);
  };

  const handleChangeEmail = (user: UserProfile) => {
    setEmailChangeUser(user);
    setShowEmailChange(true);
    setShowUserDetail(false);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'delete_user',
          user_id: user.user_id
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });

      setShowUserDetail(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (role: string) => {
    const variants = {
      master: 'default',
      technician: 'secondary',
      client: 'outline'
    } as const;
    
    const labels = {
      master: 'Master',
      technician: 'Técnico',
      client: 'Cliente'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="mobile-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-primary" />
                <h1 className="text-lg sm:text-xl font-bold">Gestão de Usuários</h1>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {plan && (
                <div className="text-sm text-muted-foreground">
                  {users.filter(u => u.active).length}/{plan.max_users} usuários
                </div>
              )}
              <Button onClick={handleCreateUser} size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-container py-4 sm:py-8 max-w-full overflow-x-hidden">
        {/* Search */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários da Empresa</CardTitle>
            <CardDescription>
              Gerencie os usuários da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Tente uma busca diferente' : 'Comece criando seu primeiro usuário'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateUser}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Usuário
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        user.active ? 'bg-primary' : 'bg-muted'
                      }`}>
                        {user.active ? (
                          <UserCheck className="w-4 h-4 text-white" />
                        ) : (
                          <UserX className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{user.name}</h3>
                          {getRoleBadge(user.role)}
                          {!user.active && (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.user_email}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUserStatus(user.id, user.active);
                        }}>
                          {user.active ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleResetPassword(user);
                        }}>
                          <Key className="w-4 h-4 mr-2" />
                          Resetar Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleChangeEmail(user);
                        }}>
                          <Mail className="w-4 h-4 mr-2" />
                          Alterar Email
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          companyId={company?.id || ''}
          onSuccess={handleUserFormSuccess}
          onCancel={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          open={showUserDetail}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onEdit={handleEditUser}
          onToggleStatus={handleToggleUserStatus}
          onResetPassword={handleResetPassword}
          onChangeEmail={handleChangeEmail}
          onDelete={handleDeleteUser}
        />
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && passwordResetUser && (
        <PasswordResetModal
          user={passwordResetUser}
          open={showPasswordReset}
          onClose={() => {
            setShowPasswordReset(false);
            setPasswordResetUser(null);
          }}
        />
      )}

      {/* Email Change Modal */}
      {showEmailChange && emailChangeUser && (
        <EmailChangeModal
          user={emailChangeUser}
          open={showEmailChange}
          onClose={() => {
            setShowEmailChange(false);
            setEmailChangeUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;